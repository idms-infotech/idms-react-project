const {
    getFirstDateOfCurrentFiscalYear,
    getLastDateOfCurrentFiscalYear,
    getFiscalMonthsName
} = require("../../../../utilities/utility");
const Model = require("../../../../models/production/goodsRequisitionModel");
const mongoose = require("mongoose");
const {OPTIONS} = require("../../../../helpers/global.options");
const {dateToAnyFormat} = require("../../../../helpers/dateTime");
const ObjectId = mongoose.Types.ObjectId;

exports.getGRCounts = async company => {
    try {
        const result = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$GRDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    GRStatus: {$nin: OPTIONS.defaultStatus.getAllFilterStatusArray(["OPENED", "REJECTED"])},
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
exports.getAllGRCounts = async company => {
    const rows = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$GRDate"}}
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
                allCounts: {$sum: {$cond: [{$ne: ["$GRStatus", "Rejected"]}, 1, 0]}},
                approvedCounts: {$sum: {$cond: [{$eq: ["$GRStatus", "Approved"]}, 1, 0]}},
                openedCounts: {$sum: {$cond: [{$eq: ["$GRStatus", "Opened"]}, 1, 0]}}
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

exports.getAllMonthlyGRTrends = async company => {
    try {
        const monthsArray = getFiscalMonthsName();
        let data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let result = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$GRDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    GRStatus: {$nin: OPTIONS.defaultStatus.getAllFilterStatusArray(["OPENED", "REJECTED"])},
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $group: {
                    _id: {year_month: {$substrCP: ["$GRDate", 0, 7]}},
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

            monthlyGRTrend = {months: monthsArray, orders: data};
        } else {
            monthlyGRTrend = {months: monthsArray, orders: []};
        }
        return monthlyGRTrend;
    } catch (error) {
        console.error(error);
    }
};
exports.getTotalGoodsRequisitionPerDay = async company => {
    const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
    const rows = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$GRDate"}}
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
                // count: {$sum: 1},
                count: {$sum: {$cond: [{$eq: ["$GRStatus", "Opened"]}, 1, 0]}}
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
};
