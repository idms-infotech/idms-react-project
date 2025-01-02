const {ObjectId} = require("../../../../../config/mongoose");
const {dateToAnyFormat} = require("../../../../helpers/dateTime");
const {OPTIONS} = require("../../../../helpers/global.options");
const {
    filteredGoodsTransferRequestList
} = require("../../../../models/planning/repository/goodsTransferRequestRepository");
const {
    getFiscalMonthsName,
    getFirstDateOfCurrentFiscalYear,
    getLastDateOfCurrentFiscalYear
} = require("../../../../utilities/utility");

exports.getGTRPerDayCount = async company => {
    try {
        const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
        const result = await filteredGoodsTransferRequestList([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$GTRequestDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    matchDate: currentDate
                }
            },
            {
                $group: {
                    _id: null,
                    counts: {$sum: {$cond: [{$eq: ["$status", OPTIONS.defaultStatus.APPROVED]}, 1, 0]}}
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
exports.getAllMonthlyGTReqTrends = async company => {
    try {
        const monthsArray = getFiscalMonthsName();
        let data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let result = await filteredGoodsTransferRequestList([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$GTRequestDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $group: {
                    _id: {year_month: {$substrCP: ["$GTRequestDate", 0, 7]}},
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {"_id.year_month": 1}
            },
            {
                $project: {
                    _id: 0,
                    count: 1,
                    month_year: {
                        $concat: [
                            {
                                $arrayElemAt: [
                                    monthsArray,
                                    {
                                        $subtract: [{$toInt: {$substrCP: ["$_id.year_month", 5, 2]}}, 4]
                                    }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    data: {$push: {k: "$month_year", v: "$count"}}
                }
            },
            {
                $project: {
                    data: {$arrayToObject: "$data"},
                    _id: 0
                }
            }
        ]);
        if (result.length > 0) {
            const propertyNames = Object.keys(result[0].data);
            const propertyValues = Object.values(result[0].data);
            let n = 0;
            propertyNames.forEach(elem => {
                let index = monthsArray.indexOf(elem);
                data[index] = propertyValues[n].toFixed(2);
                n++;
            });

            monthlyGTRTrends = {months: monthsArray, orders: data};
        } else {
            monthlyGTRTrends = {months: monthsArray, orders: []};
        }
        return monthlyGTRTrends;
    } catch (error) {
        console.error(error);
    }
};

exports.getGTReqCounts = async company => {
    try {
        const result = await filteredGoodsTransferRequestList([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$GTRequestDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    status: {$in: [OPTIONS.defaultStatus.APPROVED]},
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    counts: {$sum: 1}
                }
            }
        ]);
        return result[0]?.counts || 0;
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};
exports.getAllGTReqCounts = async company => {
    const rows = await filteredGoodsTransferRequestList([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$GTRequestDate"}}
            }
        },
        {
            $match: {
                company: ObjectId(company),
                matchDate: {
                    $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                    $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                }
            }
        },
        {
            $group: {
                _id: null,
                allCounts: {$sum: {$cond: [{$ne: ["$status", OPTIONS.defaultStatus.REJECTED]}, 1, 0]}},
                approvedCounts: {$sum: {$cond: [{$eq: ["$status", OPTIONS.defaultStatus.APPROVED]}, 1, 0]}},
                openedCounts: {$sum: {$cond: [{$eq: ["$status", OPTIONS.defaultStatus.AWAITING_APPROVAL]}, 1, 0]}}
            }
        },
        {
            $project: {
                _id: 0,
                allCounts: 1,
                approvedCounts: 1,
                openedCounts: 1
            }
        }
    ]);
    return rows.length > 0 ? rows[0] : [];
};
exports.perDayTotalGTReq = async company => {
    try {
        const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
        const rows = await filteredGoodsTransferRequestList([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$GTRequestDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    matchDate: currentDate
                }
            },
            {
                $group: {
                    _id: null,
                    count: {$sum: {$cond: [{$eq: ["$status", OPTIONS.defaultStatus.APPROVED]}, 1, 0]}}
                }
            },
            {
                $project: {
                    _id: 0,
                    count: 1
                }
            }
        ]);
        return rows[0]?.count || 0;
    } catch (error) {
        console.error("error", error);
    }
};
