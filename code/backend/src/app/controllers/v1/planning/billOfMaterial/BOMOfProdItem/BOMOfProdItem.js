const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../../helpers/messages.options");
const {OPTIONS} = require("../../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {PROD_ITEM_CATEGORY_TYPE} = require("../../../../../mocks/constantData");
const {
    getAllBOMOfProdItemAttributes
} = require("../../../../../models/planning/helpers/billOfMaterialHelper/BOMOfProdItemHelper");
const {BOM_OF_PROD_ITEM} = require("../../../../../mocks/schemasConstant/planningConstant");
const BOMOfProdItemRepository = require("../../../../../models/planning/repository/BOMRepository/BOMOfProdItemRepository");
const ProdItemRepository = require("../../../../../models/planning/repository/prodItemRepository");
const {getAllProdItemCategory} = require("../../../settings/prodItemCategory/prodItemCategory");
const {filteredSubModuleManagementList} = require("../../../../../models/settings/repository/subModuleRepository");
const {filteredItemList} = require("../../../../../models/purchase/repository/itemRepository");
const {getAllCheckedItemCategoriesList} = require("../../../purchase/itemCategoryMaster/itemCategoryMaster");
const ObjectId = mongoose.Types.ObjectId;

exports.create = asyncHandler(async (req, res) => {
    try {
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const itemDetails = await BOMOfProdItemRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("BOM Prod Item Production")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create BOM Prod Item Production", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAll = asyncHandler(async (req, res) => {
    try {
        const {filterBy = null, filterByCategory = null, prodUnitConfig = null} = req.query;
        let prodItemCategoryOptions = await getAllProdItemCategory([
            {
                $match: {
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE,
                    type: PROD_ITEM_CATEGORY_TYPE.PRODUCTION_ITEM
                }
            },
            {
                $project: {category: 1}
            }
        ]);
        prodItemCategoryOptions = prodItemCategoryOptions.map(x => x?.category);
        let project = getAllBOMOfProdItemAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    ...(!!prodUnitConfig && {prodUnitId: ObjectId(prodUnitConfig)})
                }
            },
            {
                $lookup: {
                    from: "ProdItemCategory",
                    localField: "prodItemCategory",
                    foreignField: "category",
                    pipeline: [
                        {
                            $match: {
                                categoryStatus: OPTIONS.defaultStatus.ACTIVE,
                                type: PROD_ITEM_CATEGORY_TYPE.PRODUCTION_ITEM
                            }
                        },
                        {
                            $project: {
                                BOMPrefix: 1,
                                inkMaster: 1
                            }
                        }
                    ],
                    as: "prodItemCategoryInfo"
                }
            },
            {
                $unwind: {
                    path: "$prodItemCategoryInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "BOMOfProdItem",
                    localField: "_id",
                    foreignField: "item",
                    pipeline: [
                        {
                            $project: {
                                revisionNo: "$revisionInfo.revisionNo",
                                totalMaterialCost: 1,
                                revisionHistory: 1,
                                partCount: 1,
                                BOMNo: 1
                            }
                        }
                    ],
                    as: "BOMOfProdItem"
                }
            },
            {
                $unwind: {
                    path: "$BOMOfProdItem",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    status: {
                        $cond: ["$BOMOfProdItem.BOMNo", OPTIONS.defaultStatus.ACTIVE, OPTIONS.defaultStatus.INACTIVE]
                    }
                }
            },
            {
                $match: {
                    ...(!!filterBy && {
                        status: filterBy
                    }),
                    ...(!!filterByCategory && {
                        prodItemCategory: filterByCategory
                    })
                }
            }
        ];
        let rows = await ProdItemRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        activeCount: {$sum: 1},
                        linkedBOM: {
                            $sum: {
                                $cond: [
                                    {
                                        $in: ["$status", [OPTIONS.defaultStatus.ACTIVE]]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        unLinkedBOM: {
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
            categoryOptions: prodItemCategoryOptions,
            statusArray: [
                {label: "Active Prod Item Count", count: rows?.totalAmounts?.activeCount ?? 0},
                {label: "Prod Item - BOM Integrated Count", count: rows?.totalAmounts?.linkedBOM ?? 0},
                {label: "Prod Item - BOM Unintegrated Count", count: rows?.totalAmounts?.unLinkedBOM ?? 0}
            ],
            statusOptions: [
                {label: "Summary by Category", value: ""},
                {label: "Report by Status - Green", value: OPTIONS.defaultStatus.ACTIVE},
                {label: "Report by Status - Red", value: OPTIONS.defaultStatus.INACTIVE}
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
        let existing = await BOMOfProdItemRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("BOM Prod Item Production");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById BOM Prod Item Production", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await BOMOfProdItemRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("BOM Prod Item Production")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("BOM Prod Item Production");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById BOM Prod Item Production", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await BOMOfProdItemRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await BOMOfProdItemRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("BOM Prod Item Production has been")
        });
    } catch (e) {
        console.error("update BOM Prod Item Production", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const featureConfig = await filteredSubModuleManagementList([
            {
                $match: {
                    _id: ObjectId(req.query.subModuleId)
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

        return res.success({
            featureConfig
        });
    } catch (error) {
        console.error("getAllMasterData BOM Prod Item Production", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getProdByBOMId = async (company, prodItemId) => {
    try {
        const rows = await BOMOfProdItemRepository.findOneDoc({
            company: company,
            item: prodItemId
        });
        return rows;
    } catch (error) {
        console.error("getProdByBOMId", error);
    }
};
exports.getBOMOfProdItemCount = async company => {
    try {
        const result = await BOMOfProdItemRepository.filteredBOMOfProdItemList([
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

exports.checkBOMOfProdItemExistsById = asyncHandler(async (req, res) => {
    try {
        let exists = await BOMOfProdItemRepository.findOneDoc({
            item: req.params.id
        });
        if (exists) {
            let errors = "BOM already exists with this same Prod Item";
            return res.preconditionFailed(errors);
        }
    } catch (error) {
        console.error("Not able to get record ", error);
    }
});

exports.getBOMDetailsByProdItemId = asyncHandler(async (req, res) => {
    try {
        let BOMData = await BOMOfProdItemRepository.findOneDoc({item: ObjectId(req.params.id)});
        const prodItemsList = await ProdItemRepository.filteredProdItemList([
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE,
                    _id: {$nin: [ObjectId(req.params.id)]},
                    company: ObjectId(req.user.company)
                }
            },
            {
                $lookup: {
                    from: "ProdItemStdCost",
                    let: {fieldId: "$_id"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$item", "$$fieldId"]
                                }
                            }
                        },
                        {
                            $addFields: {
                                prodUnitDetails: {$first: "$prodUnitDetails"}
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                prodItemCost: "$prodUnitDetails.prodItemCost"
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
                    qtyPerPC: {$literal: 0},
                    wastePercentage: {$literal: 0},
                    totalQtyPerPC: {$literal: 0},
                    ratePerUnit: {$ifNull: ["$stdCostInfo.prodItemCost", 0]},
                    itemCost: {$ifNull: ["$stdCostInfo.prodItemCost", 0]},
                    _id: 0
                }
            },
            {
                $sort: {
                    itemCode: 1
                }
            }
        ]);
        let itemCategoriesList = await getAllCheckedItemCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            BOMProdItem: true
        });
        itemCategoriesList = itemCategoriesList?.map(x => x?.category);
        const itemsList = await filteredItemList([
            {
                $match: {
                    isActive: "A",
                    company: ObjectId(req.user.company),
                    itemType: {$in: itemCategoriesList}
                }
            },
            {
                $addFields: {
                    supplierDetails: {$first: "$supplierDetails"},
                    UOM: {
                        $cond: [
                            {$or: [{$not: ["$secondaryUnit"]}, {$eq: ["$secondaryUnit", "-"]}]},
                            "$orderInfoUOM",
                            "$secondaryUnit"
                        ]
                    }
                }
            },
            {
                $unwind: {
                    path: "$supplierDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    purchaseRateCommon: {$first: "$supplierDetails.purchaseRateCommon"}
                }
            },
            {
                $project: {
                    reference: "$_id",
                    referenceModel: "Items",
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    UOM: 1,
                    qtyPerPC: {$literal: 0},
                    wastePercentage: {$literal: 0},
                    totalQtyPerPC: {$literal: 0},
                    ratePerUnit: {
                        $ifNull: [
                            {
                                $cond: [
                                    {$and: [{$eq: ["$purchaseRateCommon.unit2", "$UOM"]}, "$purchaseRateCommon.rate2"]},
                                    "$purchaseRateCommon.rate2",
                                    "$purchaseRateCommon.rate1"
                                ]
                            },
                            0
                        ]
                    },
                    itemCost: {$literal: 0},
                    _id: 0
                }
            },
            {
                $sort: {
                    itemCode: 1
                }
            }
        ]);
        if (!BOMData) {
            let prodItemData = await ProdItemRepository.getDocById(req.params.id, {
                itemCode: 1,
                itemName: 1,
                itemDescription: 1,
                prodItemCategory: 1,
                unitOfMeasurement: 1
            });
            let childItemCategoryData = await getAllProdItemCategory([
                {
                    $match: {
                        category: prodItemData?.prodItemCategory,
                        categoryStatus: OPTIONS.defaultStatus.ACTIVE
                    }
                },
                {
                    $project: {
                        _id: 0,
                        modulePrefix: "$prefix",
                        BOMPrefix: 1
                    }
                }
            ]);
            BOMData = {
                BOMNo: `${childItemCategoryData[0]?.BOMPrefix ?? BOM_OF_PROD_ITEM.MODULE_PREFIX}${
                    prodItemData?.itemCode
                }`,
                item: prodItemData?._id,
                itemCode: prodItemData?.itemCode,
                itemName: prodItemData?.itemName,
                itemDescription: prodItemData?.itemDescription,
                UOM: prodItemData?.unitOfMeasurement,
                partCount: 1,
                totalMaterialCost: 0,
                materialCostPerUnit: 0,
                status: OPTIONS.defaultStatus.ACTIVE,
                BOMOfProdItemDetails: [...itemsList, ...prodItemsList],
                revisionInfo: {
                    revisionNo: null,
                    revisionDate: null,
                    reasonForRevision: null,
                    revisionProposedBy: null,
                    revisionApprovedBy: null
                }
            };
        }
        BOMData = JSON.parse(JSON.stringify(BOMData));
        BOMData.BOM_Items = [...itemsList, ...prodItemsList];
        return res.success(BOMData);
    } catch (e) {
        console.error("getBOMDetailsBySKUId", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getBOMDetailsForInk = asyncHandler(async (req, res) => {
    try {
        let BOMData = await BOMOfProdItemRepository.findOneDoc({item: ObjectId(req.params.id)});
        let itemCategoriesList = await getAllCheckedItemCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            inkMaster: true
        });
        itemCategoriesList = itemCategoriesList?.map(x => x?.category);
        const itemsList = await filteredItemList([
            {
                $match: {
                    isActive: "A",
                    company: ObjectId(req.user.company),
                    itemType: {$in: itemCategoriesList}
                }
            },
            {
                $addFields: {
                    supplierDetails: {$first: "$supplierDetails"}
                }
            },
            {
                $unwind: {
                    path: "$supplierDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    purchaseRateCommon: {$first: "$supplierDetails.purchaseRateCommon"},
                    UOM: {
                        $cond: [
                            {$or: [{$not: ["$secondaryUnit"]}, {$eq: ["$secondaryUnit", "-"]}]},
                            "$orderInfoUOM",
                            "$secondaryUnit"
                        ]
                    }
                }
            },
            {
                $project: {
                    reference: "$_id",
                    referenceModel: "Items",
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    UOM: 1,
                    qtyPerPC: {$literal: 0},
                    wastePercentage: {$literal: 0},
                    totalQtyPerPC: {$literal: 0},
                    ratePerUnit: {
                        $ifNull: [
                            {
                                $cond: [
                                    {$and: [{$eq: ["$purchaseRateCommon.unit2", "$UOM"]}, "$purchaseRateCommon.rate2"]},
                                    "$purchaseRateCommon.rate2",
                                    "$purchaseRateCommon.rate1"
                                ]
                            },
                            0
                        ]
                    },
                    itemCost: {$literal: 0},
                    _id: 0
                }
            },
            {
                $sort: {
                    itemCode: 1
                }
            }
        ]);
        if (!BOMData) {
            let prodItemData = await ProdItemRepository.getDocById(req.params.id, {
                itemCode: 1,
                itemName: 1,
                itemDescription: 1,
                prodItemCategory: 1,
                unitOfMeasurement: 1
            });
            let childItemCategoryData = await getAllProdItemCategory([
                {
                    $match: {
                        category: prodItemData?.prodItemCategory,
                        categoryStatus: OPTIONS.defaultStatus.ACTIVE
                    }
                },
                {
                    $project: {
                        _id: 0,
                        modulePrefix: "$prefix",
                        BOMPrefix: 1
                    }
                }
            ]);
            BOM_OF_PROD_ITEM.MODULE_PREFIX;
            BOMData = {
                BOMNo: `${childItemCategoryData[0]?.BOMPrefix ?? BOM_OF_PROD_ITEM.MODULE_PREFIX}${
                    prodItemData?.itemCode
                }`,
                item: prodItemData._id,
                itemCode: prodItemData?.itemCode,
                itemName: prodItemData?.itemName,
                itemDescription: prodItemData?.itemDescription,
                UOM: prodItemData?.unitOfMeasurement,
                partCount: 1,
                totalMaterialCost: 0,
                materialCostPerUnit: 0,
                status: OPTIONS.defaultStatus.ACTIVE,
                BOMOfProdItemDetails: [...itemsList],
                revisionInfo: {
                    revisionNo: null,
                    revisionDate: null,
                    reasonForRevision: null,
                    revisionProposedBy: null,
                    revisionApprovedBy: null
                }
            };
        }
        BOMData = JSON.parse(JSON.stringify(BOMData));
        BOMData.BOM_Items = [...itemsList];
        return res.success(BOMData);
    } catch (e) {
        console.error("getBOMDetailsBySKUId", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getBOMDetailsForMaterialMaster = asyncHandler(async (req, res) => {
    try {
        let BOMData = await BOMOfProdItemRepository.findOneDoc({item: ObjectId(req.params.id)});
        let itemCategoriesList = await getAllCheckedItemCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            stockPreparation: true
        });
        itemCategoriesList = itemCategoriesList?.map(x => x?.category);
        const itemsList = await filteredItemList([
            {
                $match: {
                    isActive: "A",
                    company: ObjectId(req.user.company),
                    itemType: {$in: itemCategoriesList}
                }
            },
            {
                $addFields: {
                    supplierDetails: {$first: "$supplierDetails"},
                    UOM: {
                        $cond: [
                            {$or: [{$not: ["$secondaryUnit"]}, {$eq: ["$secondaryUnit", "-"]}]},
                            "$orderInfoUOM",
                            "$secondaryUnit"
                        ]
                    }
                }
            },
            {
                $unwind: {
                    path: "$supplierDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    purchaseRateCommon: {$first: "$supplierDetails.purchaseRateCommon"}
                }
            },
            {
                $project: {
                    reference: "$_id",
                    referenceModel: "Items",
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    UOM: 1,
                    qtyPerPC: {$literal: 0},
                    wastePercentage: {$literal: 0},
                    totalQtyPerPC: {$literal: 0},
                    ratePerUnit: {
                        $ifNull: [
                            {
                                $cond: [
                                    {$and: [{$eq: ["$purchaseRateCommon.unit2", "$UOM"]}, "$purchaseRateCommon.rate2"]},
                                    "$purchaseRateCommon.rate2",
                                    "$purchaseRateCommon.rate1"
                                ]
                            },
                            0
                        ]
                    },
                    itemCost: {$literal: 0},
                    _id: 0
                }
            },
            {
                $sort: {
                    itemCode: 1
                }
            }
        ]);
        if (!BOMData) {
            let prodItemData = await ProdItemRepository.getDocById(req.params.id, {
                itemCode: 1,
                itemName: 1,
                itemDescription: 1,
                prodItemCategory: 1,
                unitOfMeasurement: 1
            });
            let childItemCategoryData = await getAllProdItemCategory([
                {
                    $match: {
                        category: prodItemData?.prodItemCategory,
                        categoryStatus: OPTIONS.defaultStatus.ACTIVE
                    }
                },
                {
                    $project: {
                        _id: 0,
                        modulePrefix: "$prefix",
                        BOMPrefix: 1
                    }
                }
            ]);
            BOMData = {
                BOMNo: `${childItemCategoryData[0]?.BOMPrefix ?? BOM_OF_PROD_ITEM.MODULE_PREFIX}${
                    prodItemData?.itemCode
                }`,
                item: prodItemData._id,
                itemCode: prodItemData?.itemCode,
                itemName: prodItemData?.itemName,
                itemDescription: prodItemData?.itemDescription,
                UOM: prodItemData?.unitOfMeasurement,
                partCount: 1,
                totalMaterialCost: 0,
                materialCostPerUnit: 0,
                status: OPTIONS.defaultStatus.ACTIVE,
                BOMOfProdItemDetails: [...itemsList],
                revisionInfo: {
                    revisionNo: null,
                    revisionDate: null,
                    reasonForRevision: null,
                    revisionProposedBy: null,
                    revisionApprovedBy: null
                }
            };
        }
        BOMData = JSON.parse(JSON.stringify(BOMData));
        BOMData.BOM_Items = [...itemsList];
        return res.success(BOMData);
    } catch (e) {
        console.error("getBOMDetailsForMaterialMaster", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
