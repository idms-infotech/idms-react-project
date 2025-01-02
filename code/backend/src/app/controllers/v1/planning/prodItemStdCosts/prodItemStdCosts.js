const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllProdItemStdCostAttributes} = require("../../../../models/planning/helpers/prodItemStdCostHelper");
const ProdItemStdCostRepository = require("../../../../models/planning/repository/prodItemStdCostRepository");
const {PROD_ITEM_CATEGORY_TYPE} = require("../../../../mocks/constantData");
const {getAllProdItemCategory} = require("../../settings/prodItemCategory/prodItemCategory");
const {OPTIONS} = require("../../../../helpers/global.options");
const ProdItemRepository = require("../../../../models/planning/repository/prodItemRepository");
const BOMOfProdItemRepository = require("../../../../models/planning/repository/BOMRepository/BOMOfProdItemRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        const itemCategories = await getAllProdItemCategory([
            {
                $match: {
                    type: PROD_ITEM_CATEGORY_TYPE.PRODUCTION_ITEM,
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE
                }
            }
        ]);
        const {filterBy = null, filterByCategory = null} = req.query;
        let project = getAllProdItemStdCostAttributes();
        let pipeline = [
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE,
                    company: ObjectId(req.user.company),
                    ...(!!filterByCategory && {
                        prodItemCategory: filterByCategory
                    })
                }
            },
            {
                $lookup: {
                    from: "ProdItemStdCost",
                    localField: "_id",
                    foreignField: "item",
                    pipeline: [{$project: {_id: 1, costSheetNo: 1, revisionInfo: 1, revisionHistory: 1}}],
                    as: "prodItemStdCostInfo"
                }
            },
            {
                $addFields: {
                    status: {
                        $cond: [
                            {$gt: [{$size: "$prodItemStdCostInfo"}, 0]},
                            OPTIONS.defaultStatus.ACTIVE,
                            OPTIONS.defaultStatus.INACTIVE
                        ]
                    },
                    prodItemStdCostInfo: {
                        $first: "$prodItemStdCostInfo"
                    }
                }
            },
            {
                $match: {
                    ...(!!filterBy && {
                        status: filterBy
                    })
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
                                costSheetPrefix: 1
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
                        activeItems: {$sum: 1},
                        itemLinkedData: {$sum: {$cond: [{$eq: ["$status", OPTIONS.defaultStatus.ACTIVE]}, 1, 0]}},
                        itemUnlinkedData: {$sum: {$cond: [{$eq: ["$status", OPTIONS.defaultStatus.INACTIVE]}, 1, 0]}}
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
                {label: "Active Prod Item Std Cost Count", count: rows?.totalAmounts?.activeItems ?? 0},
                {label: "Total Prod Item with Std Cost Count", count: rows?.totalAmounts?.itemLinkedData ?? 0},
                {
                    label: "Total Prod Item without Std Cost Count",
                    count: rows?.totalAmounts?.itemUnlinkedData ?? 0
                }
            ],
            categoryOptions: itemCategories?.map(x => x?.category),
            statusOptions: [
                {label: "Summary by Category", value: ""},
                {label: "Summary by Status - Red", value: OPTIONS.defaultStatus.INACTIVE},
                {label: "Summary by Status - Green", value: OPTIONS.defaultStatus.ACTIVE}
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
        const itemDetails = await ProdItemStdCostRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Prod Item Std Cost")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Prod Item Std Cost", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await ProdItemStdCostRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails = await ProdItemStdCostRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Production Item Std Cost has been")
        });
    } catch (e) {
        console.error("update Production Item Std Cost", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await ProdItemStdCostRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Production Item Std Cost")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Production Item Std Cost");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Production Item Std Cost", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let prodItemStdCostData = await ProdItemStdCostRepository.findOneDoc({item: req.query.prodItemId});
        let prodItemObj = await ProdItemRepository.filteredProdItemList([
            {
                $match: {
                    _id: ObjectId(req.query.prodItemId)
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
                                costSheetPrefix: 1
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
                    from: "ProductionUnitConfig",
                    localField: "prodUnitId",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                prodUnitName: {$concat: ["$prodUnitCode", " - ", "$prodUnitName"]}
                            }
                        }
                    ],
                    as: "productionUnitInfo"
                }
            },
            {
                $unwind: {
                    path: "$productionUnitInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    UOM: "$unitOfMeasurement",
                    jobWorkItem: "$_id",
                    costSheetPrefix: {$concat: ["$childItemCategoryInfo.costSheetPrefix", "$itemCode"]},
                    prodUnit: "$productionUnitInfo.prodUnitName",
                    _id: 0
                }
            }
        ]);
        let BOMOfJWItemData = await BOMOfProdItemRepository.findOneDoc(
            {item: req.query.prodItemId},
            {
                materialCostPerUnit: 1
            }
        );
        return res.success({
            prodItemStdCostData,
            prodItemObj: prodItemObj?.length ? prodItemObj[0] : null,
            materialCostPerUnit: BOMOfJWItemData?.materialCostPerUnit ?? 0
        });
    } catch (error) {
        console.error("getAllMasterData Production Item Std Cost", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
