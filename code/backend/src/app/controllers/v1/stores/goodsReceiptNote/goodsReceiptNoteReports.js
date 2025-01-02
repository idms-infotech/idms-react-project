const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/stores/GRNModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {outputData, getAllAggregationFooter} = require("../../../../helpers/utility");
const {getMatchData, OPTIONS} = require("../../../../helpers/global.options");
const {getAllSuppliers} = require("../../purchase/suppliers/suppliers");
const {default: mongoose} = require("mongoose");
const {getFirstDateOfCurrentFiscalYear, getLastDateOfCurrentFiscalYear} = require("../../../../utilities/utility");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const {getAllSupplierRules} = require("../../purchase/supplierRule/supplierRuleMaster");
const {getAllItems} = require("../../purchase/items/items");
const {getCompanyLocations} = require("../../settings/company/company");
const GRNHelper = require("../../../../models/stores/helpers/GRNHelper");
const GRNRepository = require("../../../../models/stores/repository/GRNRepository");
const {filteredSupplierList} = require("../../../../models/purchase/repository/supplierRepository");
const {filteredItemList} = require("../../../../models/purchase/repository/itemRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.getAllGRNReports = asyncHandler(async (req, res) => {
    try {
        const {supplier = null, toDate = null, fromDate = null, status = null} = req.query;
        const suppliers = await filteredSupplierList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isSupplierActive: "A"
                }
            },
            {
                $project: {
                    supplierName: 1
                }
            }
        ]);
        let query = {
            company: ObjectId(req.user.company),
            GRNStatus: {
                $in: [
                    OPTIONS.defaultStatus.APPROVED,
                    OPTIONS.defaultStatus.REPORT_GENERATED,
                    OPTIONS.defaultStatus.CLOSED,
                    OPTIONS.defaultStatus.REJECTED
                ]
            },
            ...(!!supplier && {
                supplier: ObjectId(supplier)
            }),
            ...(!!status && {
                GRNStatus: status == "All" ? {$exists: true} : status
            }),
            ...(!!toDate && {
                GRNDate: {
                    $lte: getEndDateTime(toDate)
                }
            })
        };
        let project = GRNHelper.getAllSupplierWiseReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $addFields: {
                    GRNDateS: {$dateToString: {format: "%d-%m-%Y", date: "$GRNDate"}}
                }
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [{$project: {supplierName: 1}}],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"}
        ];
        let rows = await GRNRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            suppliers,
            statusOptions: ["All", "Report Generated", "Closed", "Awaiting Approval"],
            ...rows
        });
    } catch (e) {
        console.error("getAllGRNReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllItemWiseReports = asyncHandler(async (req, res) => {
    try {
        let itemList = await filteredItemList([
            {$match: {company: ObjectId(req.user.company), isActive: "A"}},
            {
                $project: {
                    itemName: 1
                }
            }
        ]);
        const {item = null, toDate = null, fromDate = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            GRNStatus: {$in: ["Report Generated", "Closed"]},
            ...(!!toDate &&
                !!fromDate && {
                    createdAt: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = GRNHelper.getAllStoreItemWiseReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {$unwind: "$GRNDetails"},
            {
                $lookup: {
                    from: "Items",
                    localField: "GRNDetails.item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                itemName: 1,
                                itemCode: 1,
                                UOM: 1,
                                itemDescription: 1,
                                batchDate: 1,
                                GRNQty: 1,
                                releasedQty: 1,
                                rejectedQty: 1,
                                balancedQty: 1
                            }
                        }
                    ],
                    as: "GRNDetails.item"
                }
            },
            {$unwind: "$GRNDetails.item"},

            {
                $match: {
                    ...(!!item && {
                        "GRNDetails.item._id": ObjectId(item)
                    })
                }
            }
        ];
        let rows = await GRNRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            itemList,
            ...rows
        });
    } catch (e) {
        console.error("getAllItemWiseReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getGRNDiscrepancyReports = asyncHandler(async (req, res) => {
    try {
        const suppliers = await getAllSuppliers(req.user.company, {supplierName: 1});
        const {fromDate = null, toDate = null, supplier = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            GRNStatus: {
                $in: [
                    OPTIONS.defaultStatus.APPROVED,
                    OPTIONS.defaultStatus.REPORT_GENERATED,
                    OPTIONS.defaultStatus.CLOSED
                ]
            },
            ...(!!supplier && {
                supplier: {$eq: ObjectId(supplier)}
            }),
            ...(!!toDate &&
                !!fromDate && {
                    GRNDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = GRNHelper.getGRNDiscrepancyReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [{$project: {supplierName: 1}}],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"},
            {$unwind: "$GRNDetails"},
            {
                $addFields: {
                    GRNDateS: {$dateToString: {format: "%d-%m-%Y", date: "$GRNDate"}}
                }
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "GRNDetails.item",
                    foreignField: "_id",
                    pipeline: [{$project: {itemCode: 1, itemDescription: 1}}],
                    as: "GRNDetails.item"
                }
            },
            {$unwind: "$GRNDetails.item"},
            {
                $lookup: {
                    from: "PurchaseOrder",
                    localField: "PONumber",
                    foreignField: "_id",
                    let: {itemId: "$GRNDetails.item._id"},
                    pipeline: [
                        {$unwind: "$PODetails"},
                        {
                            $match: {
                                $expr: {$eq: ["$$itemId", "$PODetails.item"]}
                            }
                        },
                        {$project: {"PODetails.POQty": 1, PONumber: 1}}
                    ],
                    as: "PONumber"
                }
            },
            {$unwind: "$PONumber"},
            {$match: {$expr: {$ne: ["$PONumber.PODetails.POQty", "$GRNDetails.GRNQty"]}}}
        ];
        let rows = await GRNRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            suppliers,
            ...rows
        });
    } catch (e) {
        console.error("getGRNDiscrepancyReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getMonthlySupplierEvaluation = asyncHandler(async (req, res) => {
    try {
        let query = {
            company: ObjectId(req.user.company),
            GRNStatus: {
                $in: ["Report Generated", "Closed"]
            },
            GRNDate: {
                $gte: getFirstDateOfCurrentFiscalYear(),
                $lte: getLastDateOfCurrentFiscalYear()
            }
        };
        let project = await GRNHelper.getMonthlySupplierEvaluationAttributes(req.user.company);
        const pipeline = [
            {
                $match: query
            },
            {
                $project: {
                    _id: 1,
                    GRNDate: 1,
                    PONumber: 1,
                    supplier: 1
                }
            },
            {
                $lookup: {
                    from: "PurchaseOrder",
                    localField: "PONumber",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                "PODetails.deliveryDate": 1
                            }
                        }
                    ],
                    as: "PONumber"
                }
            },
            {$unwind: "$PONumber"},
            {
                $addFields: {
                    onTimeDelivery: {
                        $allElementsTrue: {
                            $map: {
                                input: "$PONumber.PODetails",
                                as: "item",
                                in: {
                                    $cond: [
                                        {
                                            $gte: [
                                                {
                                                    $dateDiff: {
                                                        startDate: "$$item.deliveryDate",
                                                        endDate: "$GRNDate",
                                                        unit: "day"
                                                    }
                                                },
                                                0
                                            ]
                                        },
                                        true,
                                        false
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    GRNDate: 1,
                    supplier: 1,
                    onTimeDelivery: 1
                }
            },
            {
                $lookup: {
                    from: "MRN",
                    localField: "_id",
                    foreignField: "GRNNumber",
                    pipeline: [{$project: {"MRNDetails.GRNQty": 1, "MRNDetails.releasedQty": 1}}],
                    as: "MRN"
                }
            },
            {$unwind: "$MRN"},
            {
                $addFields: {
                    qualitySupply: {
                        $allElementsTrue: {
                            $map: {
                                input: "$MRN.MRNDetails",
                                as: "item",
                                in: {
                                    $cond: [{$eq: ["$$item.GRNQty", "$$item.releasedQty"]}, true, false]
                                }
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    GRNDateS: {$dateToString: {format: "%m-%Y", date: "$GRNDate"}}
                }
            },
            {
                $project: {
                    _id: 1,
                    GRNDate: 1,
                    GRNDateS: 1,
                    supplier: 1,
                    onTimeDelivery: 1,
                    qualitySupply: 1
                }
            },
            {
                $group: {
                    // _id: {supplier: "$supplier", GRNDateS: "$GRNDateS"},
                    _id: "$supplier",
                    totalSupplies: {$sum: 1},
                    onTimeSupplies: {$sum: {$cond: [{$eq: ["$onTimeDelivery", true]}, 1, 0]}},
                    qualitySupplies: {$sum: {$cond: [{$eq: ["$qualitySupply", true]}, 1, 0]}}
                }
            },
            {
                $project: {
                    // supplier: "$_id.supplier",
                    supplier: "$_id",
                    // GRNDateS: "$_id.GRNDateS",
                    totalSupplies: 1,
                    onTimeSupplies: 1,
                    qualitySupplies: 1,
                    onTimeSuppliesRating: {
                        $divide: [
                            {
                                $multiply: ["$onTimeSupplies", 100]
                            },
                            "$totalSupplies"
                        ]
                    },
                    qualitySuppliesRating: {
                        $divide: [
                            {
                                $multiply: ["$qualitySupplies", 100]
                            },
                            "$totalSupplies"
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [{$project: {supplierName: 1}}],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"}
        ];
        let rows = await GRNRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (error) {
        console.error("getMonthlySupplierEvaluation", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getMonthlyEvaluationBySupplierId = asyncHandler(async (req, res) => {
    try {
        const supplierRules = await getAllSupplierRules(req.user.company);
        let onTimeSuppliesWeighage;
        let qualitySuppliesWeighage;
        for (const ele of supplierRules) {
            if (ele.name == "On Time Supplies") {
                onTimeSuppliesWeighage = ele.weight;
            }
            if (ele.name == "Quality Supplies") {
                qualitySuppliesWeighage = ele.weight;
            }
        }
        const supplierRuleList = await getAllSupplierRules(req.user.company);
        const {search = null, excel = "false", page = 1, pageSize = 10, column = "_id", direction = -1} = req.query;
        let query = {
            supplier: ObjectId(req.params.id),
            company: ObjectId(req.user.company),
            GRNStatus: {
                $in: ["Report Generated", "Closed"]
            },
            GRNDate: {
                $gte: getFirstDateOfCurrentFiscalYear(),
                $lte: getLastDateOfCurrentFiscalYear()
            }
        };
        let skip = Math.max(0, page - 1) * pageSize;
        let project = GRNHelper.getMonthlyEvaluationBySupplierIdAttributes();
        let match = await getMatchData(project, search);
        let pagination = [];
        if (excel == "false") {
            pagination = [{$skip: +skip}, {$limit: +pageSize}];
        }
        const rows = await Model.aggregate([
            {
                $match: query
            },
            {
                $project: {
                    _id: 1,
                    GRNDate: 1,
                    PONumber: 1,
                    supplier: 1
                }
            },
            {
                $lookup: {
                    from: "PurchaseOrder",
                    localField: "PONumber",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                "PODetails.deliveryDate": 1
                            }
                        }
                    ],
                    as: "PONumber"
                }
            },
            {$unwind: "$PONumber"},
            {
                $addFields: {
                    onTimeDelivery: {
                        $allElementsTrue: {
                            $map: {
                                input: "$PONumber.PODetails",
                                as: "item",
                                in: {
                                    $cond: [
                                        {
                                            $gte: [
                                                {
                                                    $dateDiff: {
                                                        startDate: "$$item.deliveryDate",
                                                        endDate: "$GRNDate",
                                                        unit: "day"
                                                    }
                                                },
                                                0
                                            ]
                                        },
                                        true,
                                        false
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    GRNDate: 1,
                    supplier: 1,
                    onTimeDelivery: 1
                }
            },
            {
                $lookup: {
                    from: "MRN",
                    localField: "_id",
                    foreignField: "GRNNumber",
                    pipeline: [{$project: {"MRNDetails.GRNQty": 1, "MRNDetails.releasedQty": 1}}],
                    as: "MRN"
                }
            },
            {$unwind: "$MRN"},
            {
                $addFields: {
                    qualitySupply: {
                        $allElementsTrue: {
                            $map: {
                                input: "$MRN.MRNDetails",
                                as: "item",
                                in: {
                                    $cond: [{$eq: ["$$item.GRNQty", "$$item.releasedQty"]}, true, false]
                                }
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    GRNDateS: {$dateToString: {format: "%m-%Y", date: "$GRNDate"}}
                }
            },
            {
                $project: {
                    _id: 1,
                    GRNDate: 1,
                    GRNDateS: 1,
                    supplier: 1,
                    onTimeDelivery: 1,
                    qualitySupply: 1
                }
            },
            {
                $group: {
                    // _id: {supplier: "$supplier", GRNDateS: "$GRNDateS"},
                    _id: "$GRNDateS",
                    totalSupplies: {$sum: 1},
                    onTimeSupplies: {$sum: {$cond: [{$eq: ["$onTimeDelivery", true]}, 1, 0]}},
                    qualitySupplies: {$sum: {$cond: [{$eq: ["$qualitySupply", true]}, 1, 0]}}
                }
            },
            {
                $project: {
                    GRNDateS: "$_id",
                    totalSupplies: 1,
                    onTimeSupplies: 1,
                    qualitySupplies: 1,
                    onTimeSuppliesRating: {
                        $round: [
                            {
                                $divide: [
                                    {
                                        $multiply: ["$onTimeSupplies", 100]
                                    },
                                    "$totalSupplies"
                                ]
                            },
                            2
                        ]
                    },
                    qualitySuppliesRating: {
                        $round: [
                            {
                                $divide: [
                                    {
                                        $multiply: ["$qualitySupplies", 100]
                                    },
                                    "$totalSupplies"
                                ]
                            },
                            2
                        ]
                    }
                }
            },
            {
                $addFields: {
                    onTimeSuppliesActualRating: {
                        $round: [
                            {
                                $divide: [
                                    {
                                        $multiply: ["$onTimeSuppliesRating", onTimeSuppliesWeighage]
                                    },
                                    100
                                ]
                            },
                            2
                        ]
                    },
                    qualitySuppliesActualRating: {
                        $round: [
                            {
                                $divide: [
                                    {
                                        $multiply: ["$qualitySuppliesRating", qualitySuppliesWeighage]
                                    },
                                    100
                                ]
                            },
                            2
                        ]
                    }
                }
            },
            ...getAllAggregationFooter(project, match, column, direction, pagination)
        ]);
        let payload = outputData(rows);
        let arr = payload.rows.map(x => +x._id.slice(0, 2));
        let monthArr = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
        let missingMonths = monthArr.filter(x => !arr.includes(x));
        let missingArray = missingMonths.map(x => {
            return {
                _id: `${String(x).padStart(2, "0")}-${
                    x < 4
                        ? new Date(getLastDateOfCurrentFiscalYear()).getFullYear()
                        : new Date(getFirstDateOfCurrentFiscalYear()).getFullYear()
                }`,
                totalSupplies: 0,
                onTimeSupplies: 0,
                qualitySupplies: 0,
                onTimeSuppliesRating: 0,
                qualitySuppliesRating: 0,
                onTimeSuppliesActualRating: 0,
                qualitySuppliesActualRating: 0,
                totalRating: 0
            };
        });
        payload.rows = [...payload.rows, ...missingArray];
        return res.success({
            supplierRuleList,
            ...payload
        });
    } catch (error) {
        console.error("getMonthlyEvaluationBySupplierId", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllGRNLocationWiseReports = asyncHandler(async (req, res) => {
    try {
        const {location = null, fromDate = null, toDate = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!location && {
                deliveryLocation: location
            }),
            ...(!!toDate &&
                !!fromDate && {
                    GRNDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = GRNHelper.getAllGRNLocationWiseReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {$unwind: "$GRNDetails"},
            {
                $lookup: {
                    from: "Items",
                    localField: "GRNDetails.item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                itemName: 1,
                                itemCode: 1,
                                itemDescription: 1
                            }
                        }
                    ],
                    as: "GRNDetails.item"
                }
            },
            {$unwind: "$GRNDetails.item"}
        ];
        let rows = await GRNRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        const locationsList = await getCompanyLocations(req.user.company);
        return res.success({
            locationsList: locationsList?.split(",")?.map(x => {
                return {
                    label: x,
                    value: x
                };
            }),
            ...rows
        });
    } catch (e) {
        console.error("getAllGRNLocationWiseReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
