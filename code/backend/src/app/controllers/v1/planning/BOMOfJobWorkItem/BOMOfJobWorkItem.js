const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllBOMOfJobWorkItemAttributes} = require("../../../../models/planning/helpers/BOMOfJobWorkItemHelper");
const {BOM_OF_JOB_WORK_ITEM} = require("../../../../mocks/schemasConstant/planningConstant");
const BOMOfJobWorkItemRepository = require("../../../../models/planning/repository/BOMOfJobWorkItemRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const {filteredItemList} = require("../../../../models/purchase/repository/itemRepository");
const {getAllCheckedItemCategoriesList} = require("../../purchase/itemCategoryMaster/itemCategoryMaster");
const {filteredProdItemList} = require("../../../../models/planning/repository/prodItemRepository");
const JobWorkItemMasterRepository = require("../../../../models/purchase/repository/jobWorkItemMasterRepository");
const {getAllProdItemCategory} = require("../../settings/prodItemCategory/prodItemCategory");
const AutoIncrementRepository = require("../../../../models/settings/repository/autoIncrementRepository");
const {PROD_ITEM_CATEGORY_TYPE} = require("../../../../mocks/constantData");
const {filteredSubModuleManagementList} = require("../../../../models/settings/repository/subModuleRepository");
const {getAllProdItemsListForBOM} = require("../prodItemMaster/prodItemMaster");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        const {filterBy = null, filterByCategory = null} = req.query;
        let childItemCategoryOptions = await getAllProdItemCategory([
            {
                $match: {
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE,
                    type: PROD_ITEM_CATEGORY_TYPE.JW_ITEM
                }
            },
            {
                $project: {category: 1}
            }
        ]);
        childItemCategoryOptions = childItemCategoryOptions.map(x => x?.category);
        let project = getAllBOMOfJobWorkItemAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company)
                }
            },
            {
                $lookup: {
                    from: "ProdItemCategory",
                    localField: "itemCategory",
                    foreignField: "category",
                    pipeline: [
                        {
                            $match: {
                                categoryStatus: OPTIONS.defaultStatus.ACTIVE,
                                type: PROD_ITEM_CATEGORY_TYPE.JW_ITEM
                            }
                        },
                        {
                            $project: {
                                BOMPrefix: 1
                            }
                        }
                    ],
                    as: "childItemCategoryInfo"
                }
            },
            {
                $unwind: {
                    path: "$childItemCategoryInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "BOMOfJobWorkItem",
                    localField: "_id",
                    foreignField: "jobWorkItem",
                    pipeline: [
                        {
                            $project: {
                                revisionNo: "$revisionInfo.revisionNo",
                                totalMaterialCost: 1,
                                revisionHistory: 1,
                                partCount: 1,
                                BOMOfJWICode: 1
                            }
                        }
                    ],
                    as: "BOMOfJobWorkItem"
                }
            },
            {
                $unwind: {
                    path: "$BOMOfJobWorkItem",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    status: {
                        $cond: [
                            "$BOMOfJobWorkItem.BOMOfJWICode",
                            OPTIONS.defaultStatus.ACTIVE,
                            OPTIONS.defaultStatus.INACTIVE
                        ]
                    }
                }
            },
            {
                $match: {
                    ...(!!filterBy && {
                        status: filterBy
                    }),
                    ...(!!filterByCategory && {
                        itemCategory: filterByCategory
                    })
                }
            }
        ];
        let rows = await JobWorkItemMasterRepository.getAllReportsPaginate({
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
            categoryOptions: childItemCategoryOptions,
            statusArray: [
                {label: "Active JW Item Count", count: rows?.totalAmounts?.activeCount ?? 0},
                {label: "JW Item - BOM Integrated Count", count: rows?.totalAmounts?.linkedBOM ?? 0},
                {label: "JW Item - BOM Unintegrated Count", count: rows?.totalAmounts?.unLinkedBOM ?? 0}
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

exports.create = asyncHandler(async (req, res) => {
    try {
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const itemDetails = await BOMOfJobWorkItemRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("BoM Of Job Work Item")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create BoM Of Job Work Item", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await BOMOfJobWorkItemRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await BOMOfJobWorkItemRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("BoM Of Job Work Item has been")
        });
    } catch (e) {
        console.error("update BoM Of Job Work Item", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await BOMOfJobWorkItemRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("BoM Of Job Work Item")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("BoM Of Job Work Item");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById BoM Of Job Work Item", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await BOMOfJobWorkItemRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("BoM Of Job Work Item");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById BoM Of Job Work Item", e);
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
        return res.success({featureConfig});
    } catch (error) {
        console.error("getAllMasterData BoM Of Job Work Item", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllItemsForBOMOfJobWorkItem = asyncHandler(async (req, res) => {
    try {
        let itemCategoriesList = await getAllCheckedItemCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            jobWorkItem: true
        });
        itemCategoriesList = itemCategoriesList?.map(x => x?.category);
        let itemsList = await filteredItemList([
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
                $project: {
                    item: "$_id",
                    referenceModel: "Items",
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    UOM: "$orderInfoUOM",
                    primaryUnit: 1,
                    secondaryUnit: 1,
                    conversionOfUnits: 1,
                    primaryToSecondaryConversion: 1,
                    unitCost: "$supplierDetails.stdCostUom1",
                    totalQtyPerPC: {$literal: 0},
                    itemCost: {$literal: 0},
                    qtyPerPartCount: {$literal: 0},
                    wastePercentage: {$literal: 0},
                    _id: 0
                }
            }
        ]);
        let childItemsList = await filteredProdItemList([
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE,
                    company: ObjectId(req.user.company)
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
                $project: {
                    item: "$_id",
                    referenceModel: "ProductionItem",
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    UOM: "$unitOfMeasurement",
                    primaryUnit: 1,
                    secondaryUnit: 1,
                    conversionOfUnits: 1,
                    primaryToSecondaryConversion: 1,
                    unitCost: "$supplierDetails.stdCostUom1",
                    totalQtyPerPC: {$literal: 0},
                    itemCost: {$literal: 0},
                    qtyPerPartCount: {$literal: 0},
                    wastePercentage: {$literal: 0},
                    _id: 0
                }
            },
            {
                $sort: {
                    itemCode: 1
                }
            }
        ]);
        if (childItemsList.length) {
            itemsList = [...itemsList, ...childItemsList];
        }
        return res.success({itemsList});
    } catch (error) {
        console.error("getAllItemsForBOMOfJobWorkItem BoM Of Job Work Item", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getBOMDetailsByJWItemId = asyncHandler(async (req, res) => {
    try {
        let BOMData = await BOMOfJobWorkItemRepository.findOneDoc({jobWorkItem: ObjectId(req.params.id)});
        let itemCategoriesList = await getAllCheckedItemCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            BOM: true
        });
        itemCategoriesList = itemCategoriesList.map(x => x.category);
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
                $lookup: {
                    from: "Supplier",
                    localField: "supplierDetails.supplierId",
                    foreignField: "_id",
                    pipeline: [{$project: {supplierCode: 1, _id: 1}}],
                    as: "supplierInfo"
                }
            },
            {
                $unwind: "$supplierInfo"
            },
            {
                $project: {
                    item: "$_id",
                    referenceModel: "Items",
                    // itemCode: {$ifNull: ["$supplierDetails.arbtCode", "$itemCode"]},
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    UOM: 1,
                    primaryUnit: "$primaryUnit",
                    secondaryUnit: "$secondaryUnit",
                    qtyPerPartCount: {$literal: 0},
                    wastePercentage: {$literal: 0},
                    totalQtyPerPC: {$literal: 0},
                    unitCost: {
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
            }
        ]);
        const prodItems = await getAllProdItemsListForBOM(req.user.company, null, "SKU", {
            item: "$_id",
            referenceModel: "ProductionItem",
            itemCode: 1,
            itemName: 1,
            itemDescription: 1,
            primaryUnit: "$primaryUnit",
            secondaryUnit: "$secondaryUnit",
            UOM: {
                $cond: [
                    {$or: [{$not: ["$secondaryUnit"]}, {$eq: ["$secondaryUnit", "-"]}]},
                    "$unitOfMeasurement",
                    "$secondaryUnit"
                ]
            },
            qtyPerPartCount: {$literal: 0},
            wastePercentage: {$literal: 0},
            totalQtyPerPC: {$literal: 0},
            unitCost: {$ifNull: ["$stdCostInfo.prodItemCost", 0]},
            itemCost: {$ifNull: ["$stdCostInfo.prodItemCost", 0]},
            _id: 0
        });
        if (!BOMData) {
            let JWItemData = await JobWorkItemMasterRepository.getDocById(req.params.id, {
                jobWorkItemCode: 1,
                jobWorkItemName: 1,
                jobWorkItemDescription: 1,
                itemCategory: 1,
                orderInfoUOM: 1
            });
            let childItemCategoryData = await getAllProdItemCategory([
                {
                    $match: {
                        category: JWItemData?.itemCategory,
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
            let BOMPrefixObj = await AutoIncrementRepository.findOneDoc(
                {
                    module: BOM_OF_JOB_WORK_ITEM.MODULE,
                    company: req.user.company
                },
                {modulePrefix: 1, _id: 0}
            );
            BOMPrefixObj.modulePrefix = BOMPrefixObj?.modulePrefix ?? BOM_OF_JOB_WORK_ITEM.MODULE_PREFIX;
            BOMData = {
                BOMOfJWICode: `${childItemCategoryData[0]?.BOMPrefix ?? BOMPrefixObj.modulePrefix}${
                    JWItemData?.jobWorkItemCode
                }`,
                jobWorkItem: JWItemData._id,
                jobWorkItemCode: JWItemData?.jobWorkItemCode,
                jobWorkItemName: JWItemData?.jobWorkItemName,
                jobWorkItemDescription: JWItemData?.jobWorkItemDescription,
                UOM: JWItemData?.orderInfoUOM,
                partCount: 1,
                totalMaterialCost: 0,
                materialCostForOnePC: 0,
                status: OPTIONS.defaultStatus.ACTIVE,
                BOMOfJobWorkItemInfo: [...itemsList, ...prodItems],
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
        BOMData.BOM_Items = [...itemsList, ...prodItems];
        return res.success(BOMData);
    } catch (e) {
        console.error("getBOMDetailsBySKUId", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
