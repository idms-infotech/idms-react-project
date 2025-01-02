const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllInkMixingAttributes} = require("../../../../models/production/helpers/inkMixingHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {INK_MIXING} = require("../../../../mocks/schemasConstant/productionConstant");
const InkMixingRepository = require("../../../../models/production/repository/inkMixingRepository");
const {filteredJobCardList} = require("../../../../models/planning/repository/jobCardRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {filteredBoMOfSKUList} = require("../../../../models/planning/repository/BOMRepository/BoMOfSKURepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const {INK_MIXING_UOM} = require("../../../../mocks/constantData");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllInkMixingAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company)}},
            {
                $unwind: "$inkMixingDetails"
            }
            // {
            //     $lookup: {
            //         from: "JobCardCreation",
            //         localField: "jobCard",
            //         foreignField: "_id",
            //         pipeline: [{$project: {_id: 0, NPD: 1, NPDNo: 1, NPDDate: 1}}],
            //         as: "jobCard"
            //     }
            // },
            // {$unwind: "$jobCard"}
        ];
        let rows = await InkMixingRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
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
        const itemDetails = await InkMixingRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Ink Mixing")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Ink Mixing", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await InkMixingRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await InkMixingRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Ink Mixing has been")
        });
    } catch (e) {
        console.error("update Ink Mixing", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await InkMixingRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Ink Mixing")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Ink Mixing");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Ink Mixing", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await InkMixingRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Ink Mixing");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Ink Mixing", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            INK_MIXING.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
        const JCOptions = await filteredJobCardList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: {$in: [OPTIONS.defaultStatus.REPORT_GENERATED]}
                }
            },
            {
                $lookup: {
                    from: "JobCardOutput",
                    localField: "_id",
                    foreignField: "jobCard",
                    pipeline: [{$project: {_id: 1}}],
                    as: "JCOutput"
                }
            },
            {
                $match: {
                    JCOutput: {$size: 0}
                }
            },
            {
                $addFields: {
                    JCDetails: {
                        $concatArrays: [
                            "$SKUDetails",
                            {
                                $map: {
                                    input: "$DSKUDetails",
                                    as: "details",
                                    in: {
                                        SKU: "$$details.DSKU",
                                        SKUNo: "$$details.DSKUNo",
                                        SKUName: "$$details.DSKUName",
                                        SKUDescription: "$$details.DSKUDescription",
                                        UOM: "$$details.UOM",
                                        batchQty: "$$details.batchQty"
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            {
                $unwind: {
                    path: "$JCDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: {jobCard: "$_id", SKU: "$JCDetails.SKU"},
                    jobCardNo: {$first: "$jobCardNo"},
                    SKUNo: {$first: "$JCDetails.SKUNo"},
                    SKUName: {$first: "$JCDetails.SKUName"},
                    SKUDescription: {$first: "$JCDetails.SKUDescription"},
                    UOM: {$first: "$JCDetails.UOM"},
                    batchQty: {$first: "$JCDetails.batchQty"}
                }
            },
            {
                $project: {
                    _id: "$_id.jobCard",
                    jobCardNo: 1,
                    SKU: "$_id.SKU",
                    SKUNo: 1,
                    SKUName: 1,
                    SKUDescription: 1,
                    UOM: 1,
                    batchQty: 1
                }
            },
            {
                $sort: {jobCardNo: 1}
            }
        ]);
        const shiftOptions = await getAllModuleMaster(req.user.company, "PRODUCTION_SHIFT");
        return res.success({autoIncrementNo, JCOptions, shiftOptions});
    } catch (error) {
        console.error("getAllMasterData Ink Mixing", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getInkDataBySKUId = asyncHandler(async (req, res) => {
    try {
        const inkMixingData = await filteredBoMOfSKUList([
            {
                $match: {
                    SKU: ObjectId(req.query.SKUId),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $unwind: "$BOMOfSKUDetails"
            },
            {
                $match: {
                    "BOMOfSKUDetails.referenceModel": "InkMaster"
                }
            },
            {
                $project: {
                    SKU: 1,
                    ink: "$BOMOfSKUDetails.reference",
                    itemCode: "$BOMOfSKUDetails.itemCode",
                    itemName: "$BOMOfSKUDetails.itemName",
                    itemDescription: "$BOMOfSKUDetails.itemDescription",
                    UOM: "$BOMOfSKUDetails.UOM",
                    MRPQty: {
                        $multiply: [
                            {
                                $divide: ["$BOMOfSKUDetails.partCount", "$partCount"]
                            },
                            +req.query.batchQty
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "InkMaster",
                    localField: "ink",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                totalQty: 1,
                                inkMasterDetails: {
                                    $filter: {
                                        input: "$inkMasterDetails",
                                        as: "details",
                                        cond: {$in: ["$$details.UoM", INK_MIXING_UOM.getInkMixingUOM()]}
                                    }
                                }
                            }
                        }
                    ],
                    as: "ink"
                }
            },
            {$unwind: "$ink"},
            {
                $addFields: {
                    batchQty: {$subtract: [{$round: ["$MRPQty", 2]}, 0]} // subtract MRPQty and openQty,
                }
            },
            {
                $project: {
                    ink: "$ink._id",
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    UOM: 1,
                    MRPQty: {$round: ["$MRPQty", 2]},
                    openQty: {$literal: 0},
                    batchQty: 1,
                    perUnitQty: "$ink.totalQty",
                    remarks: {
                        manufacturingDate: null,
                        shift: null,
                        logBookRef: null,
                        preparedBy: null,
                        checkedBy: null
                    },
                    labValues: {
                        L: null,
                        a: null,
                        b: null
                    },
                    inkDetails: {
                        $map: {
                            input: "$ink.inkMasterDetails",
                            as: "details",
                            in: {
                                item: "$$details.item",
                                referenceModel: "$$details.referenceModel",
                                seq: "$$details.seq",
                                itemCode: "$$details.itemCode",
                                itemName: "$$details.itemName",
                                itemDescription: "$$details.itemDescription",
                                UOM: "$$details.UoM",
                                qty: {
                                    $cond: [
                                        {$eq: ["$ink.totalQty", 0]},
                                        0,
                                        {
                                            $round: [
                                                {
                                                    $divide: [
                                                        {
                                                            $multiply: ["$$details.qtyPerKgFinal", "$batchQty"]
                                                        },
                                                        "$ink.totalQty"
                                                    ]
                                                },
                                                4
                                            ]
                                        }
                                    ]
                                },
                                gramUOM: "GM",
                                gramQty: {
                                    $cond: [
                                        {$eq: ["$$details.UoM", INK_MIXING_UOM.KG]},
                                        {
                                            $multiply: [
                                                {
                                                    $cond: [
                                                        {$eq: ["$ink.totalQty", 0]},
                                                        0,
                                                        {
                                                            $round: [
                                                                {
                                                                    $divide: [
                                                                        {
                                                                            $multiply: [
                                                                                "$$details.qtyPerKgFinal",
                                                                                "$batchQty"
                                                                            ]
                                                                        },
                                                                        "$ink.totalQty"
                                                                    ]
                                                                },
                                                                4
                                                            ]
                                                        }
                                                    ]
                                                },
                                                1000
                                            ]
                                        },
                                        {
                                            $cond: [
                                                {$eq: ["$$details.UoM", INK_MIXING_UOM.LTR]},
                                                {
                                                    $multiply: [
                                                        {
                                                            $cond: [
                                                                {$eq: ["$ink.totalQty", 0]},
                                                                0,
                                                                {
                                                                    $round: [
                                                                        {
                                                                            $divide: [
                                                                                {
                                                                                    $multiply: [
                                                                                        "$$details.qtyPerKgFinal",
                                                                                        "$batchQty"
                                                                                    ]
                                                                                },
                                                                                "$ink.totalQty"
                                                                            ]
                                                                        },
                                                                        4
                                                                    ]
                                                                }
                                                            ]
                                                        },
                                                        1000
                                                    ]
                                                },
                                                {
                                                    $cond: [
                                                        {$eq: ["$ink.totalQty", 0]},
                                                        0,
                                                        {
                                                            $round: [
                                                                {
                                                                    $divide: [
                                                                        {
                                                                            $multiply: [
                                                                                "$$details.qtyPerKgFinal",
                                                                                "$batchQty"
                                                                            ]
                                                                        },
                                                                        "$ink.totalQty"
                                                                    ]
                                                                },
                                                                4
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        ]);
        return res.success(inkMixingData);
    } catch (e) {
        console.error("getInkDataBySKUId Ink Mixing", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
