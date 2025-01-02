const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllJWIItemStdCostAttributes} = require("../../../../models/planning/helpers/JWIItemStdCostHelper");
const JWIItemStdCostRepository = require("../../../../models/planning/repository/JWIItemStdCostRepository");
const {getAllProdItemCategory} = require("../../settings/prodItemCategory/prodItemCategory");
const {PROD_ITEM_CATEGORY_TYPE} = require("../../../../mocks/constantData");
const {OPTIONS} = require("../../../../helpers/global.options");
const JobWorkItemMasterRepository = require("../../../../models/purchase/repository/jobWorkItemMasterRepository");
const {filteredSupplierList} = require("../../../../models/purchase/repository/supplierRepository");
const {getAllCheckedSupplierCategoriesList} = require("../../settings/supplierCategory/supplierCategory");
const BOMOfJobWorkItemRepository = require("../../../../models/planning/repository/BOMOfJobWorkItemRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let itemCategories = await getAllProdItemCategory([
            {
                $match: {
                    type: PROD_ITEM_CATEGORY_TYPE.JW_ITEM,
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE
                }
            }
        ]);
        const {filterBy = null, filterByCategory = null} = req.query;
        let project = getAllJWIItemStdCostAttributes();
        let pipeline = [
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE,
                    company: ObjectId(req.user.company),
                    ...(!!filterByCategory && {
                        itemCategory: filterByCategory
                    })
                }
            },
            {
                $lookup: {
                    from: "JWIItemStdCost",
                    localField: "_id",
                    foreignField: "jobWorkItem",
                    pipeline: [{$project: {_id: 1, costSheetNo: 1, revisionHistory: 1, revisionInfo: 1}}],
                    as: "JWIItemStdCostInfo"
                }
            },
            {
                $addFields: {
                    status: {
                        $cond: [
                            {$gt: [{$size: "$JWIItemStdCostInfo"}, 0]},
                            OPTIONS.defaultStatus.ACTIVE,
                            OPTIONS.defaultStatus.INACTIVE
                        ]
                    },
                    JWIItemStdCostInfo: {
                        $first: "$JWIItemStdCostInfo"
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
        let rows = await JobWorkItemMasterRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        activeItems: {$sum: 1},
                        itemWithSLData: {$sum: {$cond: [{$eq: ["$status", OPTIONS.defaultStatus.ACTIVE]}, 1, 0]}},
                        itemWithoutSLData: {$sum: {$cond: [{$eq: ["$status", OPTIONS.defaultStatus.INACTIVE]}, 1, 0]}}
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
                {label: "Active JWI Std Cost Count", count: rows?.totalAmounts?.activeItems ?? 0},
                {label: "Total JWI with Std Cost Count", count: rows?.totalAmounts?.itemWithSLData ?? 0},
                {label: "Total JWI without Std Cost Count", count: rows?.totalAmounts?.itemWithoutSLData ?? 0}
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
        const itemDetails = await JWIItemStdCostRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("JWI Item Std Cost")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create JWI Item Std Cost", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await JWIItemStdCostRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails = await JWIItemStdCostRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("JWI Item Std Cost has been")
        });
    } catch (e) {
        console.error("update JWI Item Std Cost", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await JWIItemStdCostRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("JWI Item Std Cost")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("JWI Item Std Cost");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById JWI Item Std Cost", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await JWIItemStdCostRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("JWI Item Std Cost");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById JWI Item Std Cost", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let JWItemStdCostData = await JWIItemStdCostRepository.findOneDoc({jobWorkItem: req.query.jobWorkItemId});
        let JWItemData = await JobWorkItemMasterRepository.filteredJobWorkItemMasterList([
            {
                $match: {
                    _id: ObjectId(req.query.jobWorkItemId)
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
                                costSheetPrefix: 1
                            }
                        }
                    ],
                    as: "JWIItemStdCostInfo"
                }
            },
            {
                $unwind: {
                    path: "$JWIItemStdCostInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    UOM: "$orderInfoUOM",
                    jobWorkItem: "$_id",
                    costSheetPrefix: {$concat: ["$JWIItemStdCostInfo.costSheetPrefix", "$jobWorkItemCode"]},
                    _id: 0
                }
            }
        ]);
        let supplierCategoryList = await getAllCheckedSupplierCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            jobWorker: true
        });
        if (supplierCategoryList.length) {
            supplierCategoryList = supplierCategoryList.map(x => x.category);
        } else {
            supplierCategoryList = [];
        }
        let jobWorkerOptions = await filteredSupplierList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isSupplierActive: "A",
                    supplierPurchaseType: {$in: supplierCategoryList}
                }
            },
            {$sort: {supplierName: 1}},
            {
                $addFields: {
                    supplierBillingAddress: {$first: "$supplierBillingAddress"}
                }
            },
            {
                $project: {
                    label: "$supplierName",
                    value: "$_id",
                    currency: "$supplierCurrency",
                    jobWorkerCode: "$supplierCode",
                    state: "$supplierBillingAddress.state",
                    cityOrDistrict: "$supplierBillingAddress.cityOrDistrict",
                    pinCode: "$supplierBillingAddress.pinCode"
                }
            }
        ]);
        let BOMOfJWItemData = await BOMOfJobWorkItemRepository.findOneDoc(
            {jobWorkItem: req.query.jobWorkItemId},
            {
                materialCostForOnePC: 1
            }
        );
        return res.success({
            jobWorkerOptions,
            JWItemData: JWItemData?.length ? JWItemData[0] : {},
            JWItemStdCostData,
            materialCost: BOMOfJWItemData?.materialCostForOnePC ?? 0
        });
    } catch (error) {
        console.error("getAllMasterData JWI Item Std Cost", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
