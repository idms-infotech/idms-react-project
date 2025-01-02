const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllBOMOfKITAttributes} = require("../../../../models/planning/helpers/BOMOfKITHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {BOM_OF_KIT} = require("../../../../mocks/schemasConstant/planningConstant");
const BOMOfKITRepository = require("../../../../models/planning/repository/BOMOfKITRepository");
const KITMasterRepository = require("../../../../models/production/repository/KITMasterRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const KITCategoryRepository = require("../../../../models/settings/repository/KITCategoryRepository");
const {filteredSKUMasterList} = require("../../../../models/sales/repository/SKUMasterRepository");
const AutoIncrementRepository = require("../../../../models/settings/repository/autoIncrementRepository");
const {KIT_MASTER} = require("../../../../mocks/schemasConstant/productionConstant");
const {getAllKITCategory} = require("../../settings/KITCategory/KITCategory");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        const {filterBy = null, filterByCategory = null} = req.query;
        const categoryOptions = await getAllKITCategory(req.user.company, null, {
            _id: 0,
            categoryName: 1,
            displayCategoryName: 1
        });
        const KITAutoIncrementedObj = await AutoIncrementRepository.findOneDoc({
            module: KIT_MASTER.MODULE,
            company: req.user.company
        });
        const BOMAutoIncrementedObj = await AutoIncrementRepository.findOneDoc({
            module: BOM_OF_KIT.MODULE,
            company: req.user.company
        });
        let KITPrefix = KITAutoIncrementedObj?.modulePrefix ?? KIT_MASTER.MODULE_PREFIX;
        let BOMPrefix = BOMAutoIncrementedObj?.modulePrefix ?? BOM_OF_KIT.MODULE_PREFIX;
        let project = getAllBOMOfKITAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    ...(!!filterByCategory && {
                        KITCategory: filterByCategory
                    })
                }
            },
            {
                $lookup: {
                    from: "BOMOfKIT",
                    localField: "_id",
                    foreignField: "KIT",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                revisionNo: "$revisionInfo.revisionNo",
                                BOMStatus: 1,
                                revisionInfo: 1,
                                revisionHistory: 1,
                            }
                        }
                    ],
                    as: "BOMOfKIT"
                }
            },
            {
                $unwind: {
                    path: "$BOMOfKIT",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "KITCategory",
                    localField: "KITCategory",
                    foreignField: "displayCategoryName",
                    pipeline: [
                        {
                            $match: {
                                status: OPTIONS.defaultStatus.ACTIVE
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                categoryPrefix: 1,
                                BOMPrefix: 1
                            }
                        }
                    ],
                    as: "KITCategoryData"
                }
            },
            {
                $unwind: {
                    path: "$KITCategoryData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    categoryPrefix: {$ifNull: ["$KITCategoryData.categoryPrefix", KITPrefix]},
                    BOMPrefix: {$ifNull: ["$KITCategoryData.BOMPrefix", BOMPrefix]},
                    revisionNo: {$concat: ["Rev", " ", {$toString: {$ifNull: ["$BOMOfKIT.revisionNo", 0]}}]},
                    BOMStatus: {
                        $cond: ["$BOMOfKIT._id", "$BOMOfKIT.BOMStatus", OPTIONS.defaultStatus.INACTIVE]
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
        let rows = await KITMasterRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        activeCount: {$sum: 1},
                        KITLinkedBOM: {
                            $sum: {
                                $cond: [
                                    {
                                        $in: [
                                            "$BOMStatus",
                                            [OPTIONS.defaultStatus.APPROVED, OPTIONS.defaultStatus.CREATED]
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        KITUnLinkedBOM: {
                            $sum: {$cond: [{$eq: ["$BOMStatus", OPTIONS.defaultStatus.INACTIVE]}, 1, 0]}
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
            categoryOptions,
            statusArray: [
                {label: "Active KIT Count", count: rows?.totalAmounts?.activeCount ?? 0},
                {label: "KIT - BOM Integrated Count", count: rows?.totalAmounts?.KITLinkedBOM ?? 0},
                {label: "KIT - BOM Unintegrated Count", count: rows?.totalAmounts?.KITUnLinkedBOM ?? 0}
            ],
            statusOptions: [
                {label: "Summary by Category", value: ""},
                {label: "Report by Status - Green", value: OPTIONS.defaultStatus.CREATED},
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
        const itemDetails = await BOMOfKITRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("BOM Of KIT")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create BOM Of KIT", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await BOMOfKITRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await BOMOfKITRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("BOM Of KIT has been")
        });
    } catch (e) {
        console.error("update BOM Of KIT", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await BOMOfKITRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("BOM Of KIT")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("BOM Of KIT");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById BOM Of KIT", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await BOMOfKITRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("BOM Of KIT");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById BOM Of KIT", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            BOM_OF_KIT.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
        return res.success({autoIncrementNo});
    } catch (error) {
        console.error("getAllMasterData BOM Of KIT", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getBOMDetailsByKITId = asyncHandler(async (req, res) => {
    try {
        let BOMData = await BOMOfKITRepository.findOneDoc({KIT: ObjectId(req.params.id)});
        const itemsList = await filteredSKUMasterList([
            {$match: {company: ObjectId(req.user.company), isActive: "A"}},
            {
                $addFields: {
                    customerInfo: {$first: "$customerInfo"},
                    UOM: {
                        $cond: [{$or: [{$not: ["$primaryUnit"]}]}, "$secondaryUnit", "$primaryUnit"]
                    }
                }
            },
            {
                $unwind: {
                    path: "$customerInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    sellingRateCommon: {$first: "$customerInfo.sellingRateCommon"}
                }
            },
            {
                $project: {
                    seq: {$literal: null},
                    reference: "$_id",
                    referenceModel: "SKUMaster",
                    SKUNo: 1,
                    SKUName: 1,
                    SKUDescription: 1,
                    UOM: 1,
                    // UOM: "$primaryUnit",
                    qtyPerPC: {$literal: 0},
                    wastePercentage: {$literal: 0},
                    totalQtyPerPC: {$literal: 0},
                    ratePerUnit: {
                        $ifNull: [
                            {
                                $cond: [
                                    {$and: [{$eq: ["$sellingRateCommon.unit2", "$UOM"]}, "$sellingRateCommon.rate2"]},
                                    "$sellingRateCommon.rate2",
                                    "$sellingRateCommon.rate1"
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
                    SKUNo: 1
                }
            }
        ]);
        if (!BOMData) {
            let KITData = await KITMasterRepository.getDocById(req.params.id, {
                KITNo: 1,
                KITName: 1,
                KITDescription: 1,
                KITCategory: 1,
                primaryUnit: 1
            });
            let categoryData = await KITCategoryRepository.findOneDoc(
                {
                    category: KITData?.KITCategory,
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE
                },
                {
                    _id: 0,
                    BOMPrefix: 1
                }
            );
            BOMData = {
                BOMNo: `${categoryData[0]?.BOMPrefix ?? BOM_OF_KIT.MODULE_PREFIX}${KITData?.KITNo}`,
                KIT: KITData._id,
                KITNo: KITData?.KITNo,
                KITName: KITData?.KITName,
                KITDescription: KITData?.KITDescription,
                UOM: KITData?.primaryUnit,
                partCount: 1,
                totalMaterialCost: 0,
                materialCostPerUnit: 0,
                status: OPTIONS.defaultStatus.ACTIVE,
                BOMOfKITDetails: [...itemsList],
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
        BOMData.BOM_SKU = [...itemsList];
        return res.success(BOMData);
    } catch (e) {
        console.error("getBOMDetailsBySKUId", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
