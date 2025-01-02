const asyncHandler = require("express-async-handler");
const Model = require("../../../../../models/planning/billOfMaterialModels/BoMOfSKUModel");
const MESSAGES = require("../../../../../helpers/messages.options");
const {generateCreateData, OPTIONS} = require("../../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {getAllSKUs, getAllInkDetailsForBOM} = require("../../../sales/SKU/SKU");
const ProdItemMaster = require("../../prodItemMaster/prodItemMaster");
const {getAllItemsForBOM} = require("../../../purchase/items/items");
const {getAllCheckedItemCategoriesList} = require("../../../purchase/itemCategoryMaster/itemCategoryMaster");
const {getAllInkListForBOM} = require("../../../production/inkMaster/inkMaster");
const {
    getAllBOMOfSKUAttributes,
    getSKUListForBOMAttributes,
    getAllReportsAttributes
} = require("../../../../../models/planning/helpers/billOfMaterialHelper/BoMOfSKUHelper");
const {BOM_OF_SKU} = require("../../../../../mocks/schemasConstant/planningConstant");
const {getAndSetAutoIncrementNo} = require("../../../settings/autoIncrement/autoIncrement");
const BOMOfSKURepository = require("../../../../../models/planning/repository/BOMRepository/BoMOfSKURepository");
const {INK_MIXING_UOM, COMPANY_TYPE} = require("../../../../../mocks/constantData");
const {getCompanyById} = require("../../../settings/company/company");
const SKUMasterRepository = require("../../../../../models/sales/repository/SKUMasterRepository");
const {SKU_MASTER} = require("../../../../../mocks/schemasConstant/salesConstant");
const AutoIncrementRepository = require("../../../../../models/settings/repository/autoIncrementRepository");
const {filteredSKUCategoryList} = require("../../../../../models/settings/repository/SKUCategoryRepository");
const {filteredCustomerList} = require("../../../../../models/sales/repository/customerRepository");
const {getAllSKUCategory} = require("../../../settings/SKUCategoryMaster/SKUCategoryMaster");
const {
    filteredProductCategoryMasterList
} = require("../../../../../models/settings/repository/productCategoryRepository");
const {getQMSMappingByModuleAndTitle} = require("../../../settings/report-qms-mapping/report-qms-mapping");
const {filteredSubModuleManagementList} = require("../../../../../models/settings/repository/subModuleRepository");
const {
    filteredJobWorkItemMasterList
} = require("../../../../../models/purchase/repository/jobWorkItemMasterRepository");
const SalesProductMasterRepository = require("../../../../../models/sales/repository/salesProductMasterRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.create = asyncHandler(async (req, res) => {
    try {
        let exists = await Model.findOne(
            {
                SKU: req.body.SKUId
            },
            {_id: 1}
        );
        if (exists) {
            let errors = MESSAGES.apiErrorStrings.Data_EXISTS("SKU");
            return res.preconditionFailed(errors);
        }
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const saveObj = new Model(createdObj);
        const itemDetails = await saveObj.save();
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("BoM Of SKU")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create BoM Of SKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAll = asyncHandler(async (req, res) => {
    try {
        const {filterBy = null} = req.query;
        const SKUAutoIncrementedObj = await AutoIncrementRepository.findOneDoc({
            module: SKU_MASTER.MODULE,
            company: req.user.company
        });
        const BOMAutoIncrementedObj = await AutoIncrementRepository.findOneDoc({
            module: BOM_OF_SKU.MODULE,
            company: req.user.company
        });
        let SKUPrefix = SKUAutoIncrementedObj?.modulePrefix ?? SKU_MASTER.MODULE_PREFIX;
        let BOMPrefix = BOMAutoIncrementedObj?.modulePrefix ?? BOM_OF_SKU.MODULE_PREFIX;
        let project = getAllBOMOfSKUAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company)
                }
            },
            {
                $lookup: {
                    from: "BoMOfSKU",
                    localField: "_id",
                    foreignField: "SKU",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                revisionNo: "$revisionInfo.revisionNo",
                                BOMStatus: 1
                            }
                        }
                    ],
                    as: "BOMOfSKU"
                }
            },
            {
                $unwind: {
                    path: "$BOMOfSKU",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "SKUCategory",
                    localField: "productCategory",
                    foreignField: "displayProductCategoryName",
                    pipeline: [
                        {
                            $match: {
                                categoryStatus: OPTIONS.defaultStatus.ACTIVE
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                SKUCategoryPrefix: 1,
                                BOMPrefix: 1
                            }
                        }
                    ],
                    as: "SKUCategoryData"
                }
            },
            {
                $unwind: {
                    path: "$SKUCategoryData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    SKUCategoryPrefix: {$ifNull: ["$SKUCategoryData.SKUCategoryPrefix", SKUPrefix]},
                    BOMPrefix: {$ifNull: ["$SKUCategoryData.BOMPrefix", BOMPrefix]},
                    revisionNo: {$concat: ["Rev", " ", {$toString: {$ifNull: ["$BOMOfSKU.revisionNo", 0]}}]},
                    BOMStatus: {
                        $cond: ["$BOMOfSKU._id", "$BOMOfSKU.BOMStatus", OPTIONS.defaultStatus.INACTIVE]
                    }
                }
            },
            {
                $match: {
                    ...(!!filterBy && {
                        BOMStatus: filterBy
                    })
                }
            }
        ];
        let rows = await SKUMasterRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        activeCount: {$sum: 1},
                        SKULinkedBOM: {
                            $sum: {
                                $cond: [
                                    {
                                        $in: [
                                            "$status",
                                            [OPTIONS.defaultStatus.APPROVED, OPTIONS.defaultStatus.CREATED]
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        SKUUnLinkedBOM: {
                            $sum: {$cond: [{$eq: ["$status", OPTIONS.defaultStatus.INACTIVE]}, 1, 0]}
                        }
                    }
                },
                {
                    $project: {
                        _id: 0
                    }
                }
            ]
        });
        return res.success({
            ...rows,
            statusArray: [
                {label: "Active SKU Count", count: rows?.totalAmounts?.activeCount ?? 0},
                {label: "SKU - BOM Integrated Count", count: rows?.totalAmounts?.SKULinkedBOM ?? 0},
                {label: "SKU - BOM Unintegrated Count", count: rows?.totalAmounts?.SKUUnLinkedBOM ?? 0}
            ],
            statusOptions: [
                {label: "Report by Status - Green", value: OPTIONS.defaultStatus.APPROVED},
                {label: "Report by Status - Red", value: OPTIONS.defaultStatus.INACTIVE},
                {label: "Report by Status - Yellow", value: OPTIONS.defaultStatus.CREATED}
            ]
        });
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("BoM Of SKU");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById BoM Of SKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("BoM Of SKU")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("BoM Of SKU");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById BoM Of SKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await Model.findById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await generateCreateData(itemDetails, req.body);
        if (req.body.BOMOfSKUDetails) {
            itemDetails.BOMOfSKUDetails = req.body.BOMOfSKUDetails;
        }
        itemDetails = await itemDetails.save();

        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("BoM Of SKU has been")
        });
    } catch (e) {
        console.error("update BoM Of SKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        req.query.subModuleIdArr = req.query?.subModuleIdArr?.map(x => ObjectId(x)) || [];
        const featureConfig = await filteredSubModuleManagementList([
            {
                $match: {
                    $expr: {$in: ["$_id", req.query.subModuleIdArr]}
                }
            },
            {
                $unwind: "$featureConfig"
            },
            {
                $match: {
                    "featureConfig.status": true
                }
            },
            {
                $project: {
                    featureCode: "$featureConfig.featureCode",
                    value: "$featureConfig.value"
                }
            }
        ]);

        let SKUOptions = await getAllSKUs(req.user.company, {
            SKUNo: 1,
            SKUName: 1,
            SKUDescription: 1,
            primaryUnit: 1,
            ups: {$ifNull: ["$packingStdAttribute.primaryPacking", "$dimensionsDetails.layoutDimensions.ups"]}
        });
        const autoIncrementNo = await getAndSetAutoIncrementNo({...BOM_OF_SKU.AUTO_INCREMENT_DATA()}, req.user.company);
        return res.success({
            SKUOptions,
            autoIncrementNo,
            featureConfig
        });
    } catch (error) {
        console.error("getAllMasterData BoM Of SKU", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getBOMOfSKUCount = async company => {
    try {
        const result = await Model.aggregate([
            {
                $match: {
                    company: ObjectId(company)
                }
            },
            {
                $group: {
                    _id: null,
                    counts: {$sum: 1}
                }
            },
            {
                $project: {
                    _id: 0,
                    counts: 1
                }
            }
        ]);
        return result[0]?.counts || 0;
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};

exports.getAllInkListBySKUId = asyncHandler(async (req, res) => {
    try {
        if (req.query.action == "create") {
            let exists = await Model.findOne(
                {
                    SKU: req.query.SKUId
                },
                {_id: 1}
            );
            if (exists) {
                let errors = MESSAGES.apiErrorStrings.Data_EXISTS("SKU");
                return res.preconditionFailed(errors);
            }
        }
        let rows = await getAllInkDetailsForBOM(req.user.company, req.query.SKUId);
        let listType = "Ink";
        if (!rows?.length) {
            listType = "Merged";
            let itemCategoriesList = await getAllCheckedItemCategoriesList({
                categoryStatus: OPTIONS.defaultStatus.ACTIVE,
                BOM: true
            });
            itemCategoriesList = itemCategoriesList.map(x => x.category);
            const inkList = await getAllInkListForBOM(req.user.company);
            const childItems = await ProdItemMaster.getAllProdItemsListForBOM(req.user.company, null, "SKU");
            const itemsList = await getAllItemsForBOM(req.user.company, itemCategoriesList);
            rows = [...itemsList, ...childItems];
            let companyData = await getCompanyById(req.user.company, {
                companyType: 1
            });
            rows = rows.map(x => {
                if (companyData.companyType == COMPANY_TYPE.PRINTING_INDUSTRY) {
                    x.unitCost = x.UOM == INK_MIXING_UOM.KG ? x.unitCost / 1000 : x.unitCost;
                    x.UOM = x.UOM == INK_MIXING_UOM.KG ? INK_MIXING_UOM.GRAM : x.UOM;
                }
                return x;
            });
            rows = [...rows, ...inkList];
        }
        return res.success({rows, listType});
    } catch (e) {
        console.error("getAllInkListBySKUId", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.createBOMOfSKU = async obj => {
    try {
        obj = JSON.parse(JSON.stringify(obj));
        delete obj._id;
        delete obj.BOMNo;
        delete obj.__v;
        let createdObj = {
            ...obj
        };
        let newBOMOfDSKU = await Model.create(createdObj);
        return {
            _id: newBOMOfDSKU._id,
            BOMNo: newBOMOfDSKU.BOMNo
        };
    } catch (error) {
        console.error("Create SKU On NPD Master Update::::: Error in creating SKU ======= ", error);
    }
};

exports.getBOMBySKUId = async (company, SKUId) => {
    try {
        return await Model.findOne({company: company, SKU: SKUId}, {_id: 1});
    } catch (e) {
        console.error("getBOMBySKUId", e);
    }
};

exports.getMaterialCostBySKUId = async (company, SKUId) => {
    try {
        const SKUObj = await Model.findOne({company: company, SKU: SKUId}, {totalMaterialCost: 1});
        return SKUObj?.totalMaterialCost || 0;
    } catch (e) {
        console.error("getBOMBySKUId", e);
    }
};

exports.getBOMBySKUIdForMRP = asyncHandler(async (req, res) => {
    try {
        let result = await BOMOfSKURepository.filteredBoMOfSKUList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    SKU: ObjectId(req.query.SKUId)
                }
            },
            {
                $project: {
                    BOMOfSKUDetails: 1,
                    BOMNo: 1
                }
            }
        ]);
        return res.success(result.length ? result[0] : []);
    } catch (error) {
        console.error("getBOMBySKUIdForMRP  ", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getSKUListForBOM = asyncHandler(async (req, res) => {
    try {
        const {filterBy = null, filterByCategory = null} = req.query;
        const SKUCategoryOptions = await getAllSKUCategory(req.user.company, null, {
            _id: 0,
            SKUCategoryName: 1,
            displayProductCategoryName: 1
        });
        const SKUAutoIncrementedObj = await AutoIncrementRepository.findOneDoc({
            module: SKU_MASTER.MODULE,
            company: req.user.company
        });
        const BOMAutoIncrementedObj = await AutoIncrementRepository.findOneDoc({
            module: BOM_OF_SKU.MODULE,
            company: req.user.company
        });
        let SKUPrefix = SKUAutoIncrementedObj?.modulePrefix ?? SKU_MASTER.MODULE_PREFIX;
        let BOMPrefix = BOMAutoIncrementedObj?.modulePrefix ?? BOM_OF_SKU.MODULE_PREFIX;
        let project = getSKUListForBOMAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    ...(!!filterByCategory && {
                        productCategory: filterByCategory
                    })
                }
            },
            {
                $lookup: {
                    from: "BoMOfSKU",
                    localField: "_id",
                    foreignField: "SKU",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                revisionNo: "$revisionInfo.revisionNo",
                                revisionHistory: 1,
                                totalMaterialCost: 1,
                                BOMStatus: 1
                            }
                        }
                    ],
                    as: "BOMOfSKU"
                }
            },
            {
                $unwind: {
                    path: "$BOMOfSKU",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "SKUCategory",
                    localField: "productCategory",
                    foreignField: "displayProductCategoryName",
                    pipeline: [
                        {
                            $match: {
                                categoryStatus: OPTIONS.defaultStatus.ACTIVE
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                SKUCategoryPrefix: 1,
                                BOMPrefix: 1
                            }
                        }
                    ],
                    as: "SKUCategoryData"
                }
            },
            {
                $unwind: {
                    path: "$SKUCategoryData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    SKUCategoryPrefix: {$ifNull: ["$SKUCategoryData.SKUCategoryPrefix", SKUPrefix]},
                    BOMPrefix: {$ifNull: ["$SKUCategoryData.BOMPrefix", BOMPrefix]},
                    revisionNo: {$concat: ["Rev", " ", {$toString: {$ifNull: ["$BOMOfSKU.revisionNo", 0]}}]},
                    BOMStatus: {
                        $cond: ["$BOMOfSKU._id", "$BOMOfSKU.BOMStatus", OPTIONS.defaultStatus.INACTIVE]
                    }
                }
            },
            {
                $match: {
                    ...(!!filterBy && {
                        BOMStatus: filterBy
                    })
                }
            }
        ];
        let rows = await SKUMasterRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        activeCount: {$sum: 1},
                        SKULinkedBOM: {
                            $sum: {
                                $cond: [
                                    {
                                        $in: [
                                            "$status",
                                            [OPTIONS.defaultStatus.APPROVED, OPTIONS.defaultStatus.CREATED]
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        SKUUnLinkedBOM: {
                            $sum: {$cond: [{$eq: ["$status", OPTIONS.defaultStatus.INACTIVE]}, 1, 0]}
                        }
                    }
                },
                {
                    $project: {
                        _id: 0
                    }
                }
            ]
        });
        return res.success({
            ...rows,
            SKUCategoryOptions,
            statusArray: [
                {label: "Active SKU Count", count: rows?.totalAmounts?.activeCount ?? 0},
                {label: "SKU - BOM Integrated Count", count: rows?.totalAmounts?.SKULinkedBOM ?? 0},
                {label: "SKU - BOM Unintegrated Count", count: rows?.totalAmounts?.SKUUnLinkedBOM ?? 0}
            ],
            statusOptions: [
                {label: "Summary by Category", value: ""},
                {label: "Report by Status - Green", value: OPTIONS.defaultStatus.CREATED},
                {label: "Report by Status - Red", value: OPTIONS.defaultStatus.INACTIVE}
            ]
        });
    } catch (e) {
        console.error("getSKUListForBOM", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getBOMDetailsBySKUId = asyncHandler(async (req, res) => {
    try {
        let BOMData = await BOMOfSKURepository.findOneDoc({SKU: ObjectId(req.params.id)});
        let itemCategoriesList = await getAllCheckedItemCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            BOM: true
        });
        itemCategoriesList = itemCategoriesList.map(x => x.category);
        const prodItems = await ProdItemMaster.getAllProdItemsListForBOM(req.user.company, null, "SKU", {
            reference: "$_id",
            referenceModel: "ProductionItem",
            itemCode: 1,
            itemName: 1,
            itemDescription: 1,
            UOM: {
                $cond: [
                    {$or: [{$not: ["$secondaryUnit"]}, {$eq: ["$secondaryUnit", "-"]}]},
                    "$unitOfMeasurement",
                    "$secondaryUnit"
                ]
            },
            unitCost: {$ifNull: ["$stdCostInfo.prodItemCost", 0]},
            partCount: {$literal: 0},
            itemCost: {$ifNull: ["$stdCostInfo.prodItemCost", 0]},
            qtyPerSKUUnit: {$literal: 0},
            wastePercentage: {$literal: 0},
            refDesignator: {$literal: null},
            supplierPartNo: null,
            BOMLevel: 1,
            BOM: "NA",
            type: "prodItem",
            _id: 0
        });
        const JWItems = await filteredJobWorkItemMasterList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $lookup: {
                    from: "JWIItemStdCost",
                    let: {fieldId: "$_id"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$jobWorkItem", "$$fieldId"]
                                }
                            }
                        },
                        {
                            $addFields: {
                                jobWorkerDetails: {$first: "$jobWorkerDetails"}
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                totalJWItemCost: "$jobWorkerDetails.totalJWItemCost"
                            }
                        }
                    ],
                    as: "stdCostInfo"
                }
            },
            {
                $unwind: {
                    path: "$stdCostInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    reference: "$_id",
                    referenceModel: "JobWorkItemMaster",
                    itemCode: "$jobWorkItemCode",
                    itemName: "$jobWorkItemName",
                    itemDescription: "$jobWorkItemDescription",
                    UOM: {
                        $cond: [
                            {$or: [{$not: ["$secondaryUnit"]}, {$eq: ["$secondaryUnit", "-"]}]},
                            "$orderInfoUOM",
                            "$secondaryUnit"
                        ]
                    },
                    unitCost: {$ifNull: ["$stdCostInfo.totalJWItemCost", 0]},
                    partCount: {$literal: 0},
                    itemCost: {$ifNull: ["$stdCostInfo.totalJWItemCost", 0]},
                    qtyPerSKUUnit: {$literal: 0},
                    wastePercentage: {$literal: 0},
                    refDesignator: {$literal: null},
                    supplierPartNo: null,
                    BOMLevel: 1,
                    BOM: "NA",
                    type: "jobWorkItem",
                    _id: 0
                }
            },
            {
                $sort: {
                    itemCode: 1
                }
            }
        ]);
        const itemsList = await getAllItemsForBOM(req.user.company, itemCategoriesList);
        let SKUData = await SKUMasterRepository.filteredSKUMasterList([
            {$match: {_id: ObjectId(req.params.id)}},
            {
                $addFields: {
                    materialInfo: {
                        $filter: {
                            input: {
                                $map: {
                                    input: "$materialInfo",
                                    as: "info",
                                    in: {
                                        $cond: [
                                            {$eq: ["$SKUMaterialStatus", OPTIONS.defaultStatus.ACTIVE]},
                                            {
                                                $mergeObjects: [
                                                    "$$info",
                                                    {
                                                        reference: "$$info.item",
                                                        referenceModel: "Items",
                                                        UOM: "$$info.UoM",
                                                        wastePercentage: {$literal: 0},
                                                        qtyPerSKUUnit: {$literal: 1},
                                                        partCount: {$literal: 1},
                                                        itemCost: {$ifNull: ["$$info.unitCost", 0]}
                                                    }
                                                ]
                                            },
                                            null
                                        ]
                                    }
                                }
                            },
                            as: "info",
                            cond: {$ne: ["$$info", null]}
                        }
                    },
                    inkDetails: {
                        $filter: {
                            input: {
                                $map: {
                                    input: "$inkDetails",
                                    as: "detail",
                                    in: {
                                        $cond: [
                                            {$eq: ["$SKUInkStatus", OPTIONS.defaultStatus.ACTIVE]},
                                            {
                                                $mergeObjects: [
                                                    "$$detail",
                                                    {
                                                        ups: "$dimensionsDetails.layoutDimensions.ups",
                                                        reference: "$$detail.inkId",
                                                        UOM: "$$detail.UoM",
                                                        wastePercentage: {$literal: 0},
                                                        referenceModel: "ProductionItem",
                                                        qtyPerSKUUnit: {
                                                            $ifNull: ["$$detail.ink", 0]
                                                        },
                                                        partCount: {
                                                            $ifNull: ["$$detail.ink", 0]
                                                        },
                                                        type: "ink",
                                                        unitCost: {$ifNull: ["$detail.unitCost", 0]},
                                                        itemCost: {$ifNull: ["$$detail.unitCost", 0]}
                                                    }
                                                ]
                                            },
                                            null
                                        ]
                                    }
                                }
                            },
                            as: "detail",
                            cond: {$ne: ["$$detail", null]}
                        }
                    }
                }
            },
            {
                $project: {
                    SKUNo: 1,
                    primaryUnit: 1,
                    SKUName: 1,
                    SKUDescription: 1,
                    productCategory: 1,
                    artWorkNo: 1,
                    partCount: "$dimensionsDetails.layoutDimensions.ups",
                    BOMOfSKUDetails: {
                        $concatArrays: [
                            {
                                $sortArray: {input: "$materialInfo", sortBy: {itemCode: 1}}
                            },
                            {
                                $sortArray: {input: "$inkDetails", sortBy: {colSeq: 1}}
                            }
                        ]
                    }
                }
            }
        ]);
        SKUData = SKUData?.length ? SKUData[0] : {};
        let BOM_Items = SKUData?.BOMOfSKUDetails?.length
            ? SKUData?.BOMOfSKUDetails
            : [...itemsList, ...prodItems, ...JWItems];
        if (!BOMData) {
            const prodMasterData = await SalesProductMasterRepository.findOneDoc(
                {productCategory: SKUData?.productCategory},
                {
                    packingStdDetails: 1
                }
            );
            let SKUCategoryData = await filteredSKUCategoryList([
                {
                    $match: {
                        displayProductCategoryName: SKUData?.productCategory,
                        categoryStatus: OPTIONS.defaultStatus.ACTIVE
                    }
                },
                {
                    $project: {
                        _id: 0,
                        modulePrefix: "$SKUCategoryPrefix",
                        BOMPrefix: 1
                    }
                }
            ]);
            if (!SKUCategoryData.length) {
                SKUCategoryData = await AutoIncrementRepository.filteredAutoIncrementList([
                    {
                        $match: {
                            module: SKU_MASTER.MODULE,
                            company: ObjectId(req.user.company)
                        }
                    },
                    {
                        $project: {modulePrefix: 1, _id: 0}
                    }
                ]);
            }
            let BOMPrefixObj = await AutoIncrementRepository.findOneDoc(
                {
                    module: BOM_OF_SKU.MODULE,
                    company: req.user.company
                },
                {modulePrefix: 1, _id: 0}
            );

            BOMPrefixObj.modulePrefix = BOMPrefixObj.modulePrefix ?? BOM_OF_SKU.MODULE_PREFIX;
            BOMData = {
                BOMNo: SKUData?.SKUNo?.replace(
                    SKUCategoryData[0]?.modulePrefix,
                    SKUCategoryData[0]?.BOMPrefix ?? BOMPrefixObj.modulePrefix
                ),
                SKU: SKUData?._id,
                documentDetails: [
                    {
                        documentNo: null,
                        documentDate: null,
                        revisionNo: 0,
                        revisionDate: null,
                        docCreatedBy: null,
                        docApprovedBy: null,
                        QMSDocumentNo: null
                    }
                ],
                SKUCode: SKUData?.SKUNo,
                SKUName: SKUData?.SKUName,
                SKUDescription: SKUData?.SKUDescription,
                UOM: SKUData?.primaryUnit,
                drawingNo: SKUData?.artWorkNo,
                partCount: SKUData?.partCount ?? prodMasterData?.packingStdDetails?.qtyPerPrimaryPack,
                BOMOfSKUDetails: BOM_Items,
                totalMaterialCost: 0,
                materialCostForOnePC: 0
            };
        }
        BOMData = JSON.parse(JSON.stringify(BOMData));
        BOMData.BOM_Items = BOM_Items;
        return res.success(BOMData);
    } catch (e) {
        console.error("getBOMDetailsBySKUId", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.copyBOMOfSKUMasterData = asyncHandler(async (req, res) => {
    try {
        const SKUAutoIncrementedObj = await AutoIncrementRepository.findOneDoc({
            module: SKU_MASTER.MODULE,
            company: req.user.company
        });
        const BOMAutoIncrementedObj = await AutoIncrementRepository.findOneDoc({
            module: BOM_OF_SKU.MODULE,
            company: req.user.company
        });
        let SKUPrefix = SKUAutoIncrementedObj?.modulePrefix ?? SKU_MASTER.MODULE_PREFIX;
        let BOMPrefix = BOMAutoIncrementedObj?.modulePrefix ?? BOM_OF_SKU.MODULE_PREFIX;
        const SKUList = await SKUMasterRepository.filteredSKUMasterList([
            {$match: {company: ObjectId(req.user.company), isActive: "A"}},
            {
                $lookup: {
                    from: "BoMOfSKU",
                    localField: "_id",
                    foreignField: "SKU",
                    pipeline: [{$project: {_id: 1}}],
                    as: "BOM"
                }
            },
            {
                $match: {
                    BOM: {$size: 0}
                }
            },
            {
                $lookup: {
                    from: "SKUCategory",
                    localField: "productCategory",
                    foreignField: "displayProductCategoryName",
                    pipeline: [
                        {
                            $match: {
                                categoryStatus: OPTIONS.defaultStatus.ACTIVE
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                SKUCategoryPrefix: 1,
                                BOMPrefix: 1
                            }
                        }
                    ],
                    as: "SKUCategoryData"
                }
            },
            {
                $unwind: {
                    path: "$SKUCategoryData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    SKUCategoryPrefix: {$ifNull: ["$SKUCategoryData.SKUCategoryPrefix", SKUPrefix]},
                    BOMPrefix: {$ifNull: ["$SKUCategoryData.BOMPrefix", BOMPrefix]},
                    revisionNo: {$concat: ["Rev", " ", {$toString: {$ifNull: ["$BOMOfSKU.revisionNo", 0]}}]},
                    BOMStatus: OPTIONS.defaultStatus.INACTIVE
                }
            },
            {
                $project: {
                    select: {$literal: false},
                    _id: 1,
                    SKUCode: "$SKUNo",
                    SKUName: 1,
                    SKUDescription: 1,
                    UOM: "$primaryUnit",
                    productCategory: 1,
                    revisionNo: 1,
                    status: "$BOMStatus",
                    BOMNo: {$replaceOne: {input: "$SKUNo", find: "$SKUCategoryPrefix", replacement: "$BOMPrefix"}}
                }
            }
        ]);
        const SKUCategoryOptions = await getAllSKUCategory(req.user.company, null, {
            _id: 0,
            SKUCategoryName: 1,
            displayProductCategoryName: 1
        });
        return res.success({SKUCategoryOptions, SKUList});
    } catch (error) {
        console.error("getAllCopyFlowMasterData BOM Of SKU", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.createCopy = asyncHandler(async (req, res) => {
    try {
        let existingData = await BOMOfSKURepository.findOneDoc({SKU: req.body.SKU});
        if (!existingData) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("BOM Of SKU");
            return res.unprocessableEntity(errors);
        }
        let SKUArr = req.body.BOMOfSKUArray.map(x => {
            return {
                company: existingData?.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                SKU: x?._id,
                BOMNo: x?.BOMNo,
                SKUCode: x?.SKUCode,
                SKUName: x?.SKUName,
                SKUDescription: x?.SKUDescription,
                UOM: x?.UOM,
                partCount: existingData?.partCount,
                drawingNo: x?.drawingNo,
                totalMaterialCost: existingData?.totalMaterialCost,
                materialCostForOnePC: existingData?.materialCostForOnePC,
                isColorInfo: existingData?.isColorInfo,
                status: existingData?.status,
                BOMStatus: existingData?.BOMStatus,
                BOMOfSKUDetails: existingData?.BOMOfSKUDetails,
                revisionInfo: req.body.revisionInfo,
                revisionHistory: [
                    {
                        BOMNo: x?.BOMNo,
                        SKU: x?._id,
                        SKUCode: x?.SKUCode,
                        SKUName: x?.SKUName,
                        SKUDescription: x?.SKUDescription,
                        UOM: x?.UOM,
                        partCount: existingData?.partCount,
                        drawingNo: x?.drawingNo,
                        BOMOfSKUDetails: existingData?.BOMOfSKUDetails,
                        totalMaterialCost: existingData?.totalMaterialCost,
                        materialCostForOnePC: existingData?.materialCostForOnePC,
                        isColorInfo: existingData?.isColorInfo,
                        status: existingData?.status,
                        BOMStatus: existingData?.BOMStatus,
                        revisionInfo: req.body.revisionInfo
                    }
                ]
            };
        });
        await BOMOfSKURepository.insertManyDoc(SKUArr);
        return res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("BOM Of SKU")
        });
    } catch (e) {
        console.error("create BOM Of SKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
