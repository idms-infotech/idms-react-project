const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {default: mongoose} = require("mongoose");
const {getCompanyLocations} = require("../../settings/company/company");
const {getDateDiff, dateToAnyFormat, getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const FGINHelper = require("../../../../models/stores/helpers/FGINHelper");
const FGINRepository = require("../../../../models/stores/repository/FGINRepository");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const {filteredSKUMasterList} = require("../../../../models/sales/repository/SKUMasterRepository");
const {getQMSMappingByModuleAndTitle} = require("../../settings/report-qms-mapping/report-qms-mapping");
const {filteredProductCategoryMasterList} = require("../../../../models/settings/repository/productCategoryRepository");
const {getAllSKUCategory} = require("../../settings/SKUCategoryMaster/SKUCategoryMaster");
const {OPTIONS} = require("../../../../helpers/global.options");
const ObjectId = mongoose.Types.ObjectId;

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const {SKUName = null, fromDate = null, toDate = null} = req.query;
        let project = FGINHelper.getAllFGINReportsAttributes();
        let query = {
            company: ObjectId(req.user.company),
            FGINQuantity: {$gt: 0},
            status: {$in: ["Created"]},
            ...(!!SKUName && {
                SKUId: ObjectId(SKUName)
            }),
            ...(!!toDate &&
                !!fromDate && {
                    manufacturingDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let pipeline = [
            {
                $match: query
            },
            {
                $addFields: {
                    balancedQty: {$toString: "$balancedQty"},
                    manufacturingDateS: {$dateToString: {format: "%d-%m-%Y", date: "$manufacturingDate"}},
                    expiryDateS: {$dateToString: {format: "%d-%m-%Y", date: "$expiryDate"}}
                }
            }
        ];
        let rows = await FGINRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        console.error("getAllFinishedGoodsInwardEntry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllFGINSummaryReports = asyncHandler(async (req, res) => {
    try {
        const {fromDate = null, toDate = null, location = null} = req.query;
        let project = FGINHelper.getAllFGINSummaryReportsAttributes();
        let query = {
            company: ObjectId(req.user.company),
            // producedQty: {$gt: 0},
            ...(!!location && {
                location: location
            }),
            ...(!!toDate &&
                !!fromDate && {
                    FGINDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let pipeline = [
            {
                $match: query
            },
            {
                $addFields: {
                    shelfLife: {
                        $cond: [
                            {
                                $ne: [{$type: "$shelfLife"}, "missing"]
                            },
                            {$ceil: "$shelfLife"},
                            {$literal: null}
                        ]
                    }
                }
            },
            {
                $addFields: {
                    expiryDate: {
                        $cond: [
                            {
                                $ne: [{$type: "$shelfLife"}, "missing"]
                            },
                            {
                                $dateAdd: {
                                    startDate: "$manufacturingDate",
                                    unit: "month",
                                    amount: "$shelfLife"
                                }
                            },
                            {$literal: null}
                        ]
                    }
                }
            }
        ];
        let rows = await FGINRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        console.error("getAllFGINSummaryReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllFGINLocationWiseReports = asyncHandler(async (req, res) => {
    try {
        const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
        const locations = await getCompanyLocations(req.user.company);
        const {fromDate = null, toDate = null, location = null} = req.query;
        let project = FGINHelper.getAllFGINLocationWiseReportsAttributes();
        let query = {
            company: ObjectId(req.user.company),
            FGINQuantity: {$gt: 0},
            ...(!!location && {
                location: location
            }),
            ...(!!toDate &&
                !!fromDate && {
                    FGINDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let pipeline = [
            {
                $match: query
            }
        ];
        let output = await FGINRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        if (output.rows.length > 0) {
            for (const ele of output.rows) {
                if (!!ele.expiryDate) {
                    ele.expiryDate = dateToAnyFormat(ele.expiryDate, "YYYY-MM-DD");
                    let dateDiff = getDateDiff(ele.expiryDate, currentDate, "days");
                    if (+dateDiff < 0) {
                        ele.aging = "red";
                    } else if (+dateDiff > 0 && +dateDiff < 30) {
                        ele.aging = "orange";
                    } else {
                        ele.aging = "green";
                    }
                    ele.expiryDate = dateToAnyFormat(ele.expiryDate, "DD-MM-YYYY");
                }
            }
        }
        return res.success({
            ...output,
            locations: locations?.split(",")?.map(x => {
                return {
                    label: x,
                    value: x
                };
            })
        });
    } catch (e) {
        console.error("getAllFGINDetailsReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllFGINAllLocationReports = asyncHandler(async (req, res) => {
    try {
        const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
        const locations = await getCompanyLocations(req.user.company);
        const {fromDate = null, location = null} = req.query;
        let project = FGINHelper.getAllFGINAllLocationReportsAttributes();
        let query = {
            company: ObjectId(req.user.company),
            FGINQuantity: {$gt: 0},
            ...(!!location && {
                location: location == "All" ? {$exists: true} : location
            }),
            ...(!!fromDate && {
                matchDate: {
                    $gte: fromDate
                }
            })
        };
        let pipeline = [
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$FGINDate"}}
                }
            },
            {
                $match: query
            }
        ];
        let output = await FGINRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        if (output.rows.length > 0) {
            for (const ele of output.rows) {
                if (!!ele.expiryDate) {
                    ele.expiryDate = dateToAnyFormat(ele.expiryDate, "YYYY-MM-DD");
                    let dateDiff = getDateDiff(ele.expiryDate, currentDate, "days");
                    if (+dateDiff < 0) {
                        ele.aging = "red";
                    } else if (+dateDiff > 0 && +dateDiff < 30) {
                        ele.aging = "orange";
                    } else {
                        ele.aging = "green";
                    }
                    ele.expiryDate = dateToAnyFormat(ele.expiryDate, "DD-MM-YYYY");
                }
            }
        }
        return res.success({
            ...output,
            locations: locations.split(",")
        });
    } catch (e) {
        console.error("getAllFGINAllLocationReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllFGINValueFinanceReports = asyncHandler(async (req, res) => {
    try {
        const locations = await getCompanyLocations(req.user.company);
        const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
        const {fromDate = null, toDate = null, location = null} = req.query;
        let project = FGINHelper.getAllFGINValueFinanceReportsAttributes();
        let query = {
            company: ObjectId(req.user.company),
            FGINQuantity: {$gt: 0},
            ...(!!location && {
                location: location
            }),
            ...(!!toDate &&
                !!fromDate && {
                    manufacturingDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let pipeline = [
            {
                $match: query
            },
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "SKUId",
                    foreignField: "_id",
                    pipeline: [{$project: {customerInfo: 1}}],
                    as: "SKUId"
                }
            },
            {$unwind: "$SKUId"},
            {
                $addFields: {
                    customerInfo: {$first: "$SKUId.customerInfo"}
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
                    lineValue: {
                        $round: [{$multiply: [{$toDouble: "$customerInfo.standardSellingRate"}, "$FGINQuantity"]}, 2]
                    }
                }
            }
        ];
        let output = await FGINRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        totalLineValue: {$sum: {$toDouble: "$lineValue"}}
                    }
                },
                {
                    $project: {
                        _id: null,
                        totalLineValue: {$round: ["$totalLineValue", 2]}
                    }
                }
            ]
        });
        if (output.rows.length > 0) {
            for (const ele of output.rows) {
                if (!!ele.expiryDate) {
                    ele.expiryDate = dateToAnyFormat(ele.expiryDate, "YYYY-MM-DD");
                    let dateDiff = getDateDiff(ele.expiryDate, currentDate, "days");
                    if (+dateDiff < 0) {
                        ele.aging = "red";
                    } else if (+dateDiff > 0 && +dateDiff < 30) {
                        ele.aging = "orange";
                    } else {
                        ele.aging = "green";
                    }
                }
            }
        }
        return res.success({
            ...output,
            locations: locations?.split(",")?.map(x => {
                return {
                    label: x,
                    value: x
                };
            })
        });
    } catch (e) {
        console.error("getAllFGINValueFinanceReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllFGInventoryReports = asyncHandler(async (req, res) => {
    try {
        let SKUCategoryList = await getAllSKUCategory(req.user.company, null);
        let productCategories = [];
        if (SKUCategoryList.length > 0) {
            productCategories = SKUCategoryList.map(x => {
                return {
                    label: x.displayProductCategoryName,
                    value: x.displayProductCategoryName
                };
            });
        } else {
            productCategories = await filteredProductCategoryMasterList([
                {
                    $match: {
                        company: ObjectId(req.user.company),
                        categoryStatus: OPTIONS.defaultStatus.ACTIVE
                    }
                },
                {$sort: {seq: 1}},
                {
                    $project: {
                        displayProductCategoryName: 1
                    }
                }
            ]);
            productCategories = productCategories.map(x => {
                return {
                    label: x.displayProductCategoryName,
                    value: x.displayProductCategoryName
                };
            });
        }
        const locations = await getCompanyLocations(req.user.company);
        let customerOptions = await filteredCustomerList([
            {
                $match: {
                    isCustomerActive: "A",
                    company: ObjectId(req.user.company)
                }
            },
            {$sort: {customerName: 1}},
            {
                $project: {
                    customerName: 1
                }
            }
        ]);
        const SKUOptions = await filteredSKUMasterList([
            {$match: {company: ObjectId(req.user.company), isActive: "A"}},
            {$project: {SKUStage: 1, productCategory: 1}}
        ]);

        const {toDate = null, location = null, SKUStage = null, customerId = null, category = null} = req.query;
        let project = FGINHelper.getAllFGInventoryReportsAttributes();
        let query = {
            company: ObjectId(req.user.company),
            FGINQuantity: {$gt: 0},
            ...(!!location && {
                location: location == "All" ? {$exists: true} : location
            }),

            ...(!!toDate && {
                matchDate: {
                    $lte: toDate
                }
            })
        };
        let pipeline = [
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$FGINDate"}},
                    aging: {
                        $cond: {
                            if: {
                                $or: [
                                    {$eq: ["$expiryDate", null]},
                                    {$gte: ["$expiryDate", {$add: [new Date(), 30 * 24 * 60 * 60 * 1000]}]}
                                ]
                            },
                            then: "green",
                            else: {
                                $cond: {
                                    if: {
                                        $gt: ["$expiryDate", new Date()]
                                    },
                                    then: "yellow",
                                    else: "red"
                                }
                            }
                        }
                    }
                }
            },
            {
                $match: query
            },
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "SKUId",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $match: {
                                ...(!!SKUStage && {
                                    SKUStage: SKUStage
                                }),
                                ...(!!customerId && {
                                    "customerInfo.customer": ObjectId(customerId)
                                }),
                                ...(!!category && {
                                    productCategory: category
                                })
                            }
                        }
                    ],
                    as: "SKU"
                }
            },
            {
                $unwind: "$SKU"
            }
        ];
        const display = await getQMSMappingByModuleAndTitle(req.user.company, "Production", "Finish Goods (FG)");
        let output = await FGINRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        FGINQuantity: {$sum: "$FGINQuantity"}
                    }
                },
                {
                    $project: {
                        totalFGINQuantity: {$round: ["$FGINQuantity", 2]},
                        _id: 0
                    }
                }
            ]
        });
        return res.success({
            ...output,
            customerOptions,
            SKUOptions,
            locations: locations.split(","),
            display,
            productCategoryOptions: productCategories
        });
    } catch (e) {
        console.error("getAllFGInventoryReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllFGBalanceSummaryReports = asyncHandler(async (req, res) => {
    try {
        const {fromDate = null, toDate = null, location = null} = req.query;
        let project = FGINHelper.getAllFGBalanceSummaryReportsAttributes();
        let query = {
            company: ObjectId(req.user.company),
            FGINQuantity: {$gt: 0},
            ...(!!location && {
                location: location
            }),
            ...(!!toDate &&
                !!fromDate && {
                    FGINDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let pipeline = [
            {
                $match: query
            },
            {
                $addFields: {
                    shelfLife: {
                        $cond: [
                            {
                                $ne: [{$type: "$shelfLife"}, "missing"]
                            },
                            {$ceil: "$shelfLife"},
                            {$literal: null}
                        ]
                    }
                }
            },
            {
                $addFields: {
                    expiryDate: {
                        $cond: [
                            {
                                $ne: [{$type: "$shelfLife"}, "missing"]
                            },
                            {
                                $dateAdd: {
                                    startDate: "$manufacturingDate",
                                    unit: "month",
                                    amount: "$shelfLife"
                                }
                            },
                            {$literal: null}
                        ]
                    }
                }
            }
        ];
        let rows = await FGINRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        console.error("getAllFGBalanceSummaryReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
