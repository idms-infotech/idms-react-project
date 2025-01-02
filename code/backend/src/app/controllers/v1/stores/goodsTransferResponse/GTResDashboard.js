const {ObjectId} = require("../../../../../config/mongoose");
const {dateToAnyFormat} = require("../../../../helpers/dateTime");
const {OPTIONS} = require("../../../../helpers/global.options");
const {
    filteredGoodsTransferResponseList
} = require("../../../../models/stores/repository/goodsTransferResponseRepository");
const {
    getFirstDateOfCurrentFiscalYear,
    getLastDateOfCurrentFiscalYear,
    getFiscalMonthsName
} = require("../../../../utilities/utility");

exports.perDayTotalGTResponseAgainstReq = async company => {
    try {
        const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
        const rows = await filteredGoodsTransferResponseList([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$GTDate"}}
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

exports.getGTResCounts = async company => {
    try {
        const result = await filteredGoodsTransferResponseList([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$GTDate"}}
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

exports.getBarChartGTResStatus = async company => {
    try {
        const monthsArray = getFiscalMonthsName();
        let GIOpenedData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let GIAcknowledgementData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const result = await filteredGoodsTransferResponseList([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$GTDate"}}
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
                    _id: {year_month: {$substrCP: ["$GTDate", 0, 7]}},
                    countAcknowledgement: {$sum: {$cond: [{$eq: ["$status", OPTIONS.defaultStatus.APPROVED]}, 1, 0]}},
                    countOpened: {$sum: {$cond: [{$eq: ["$status", OPTIONS.defaultStatus.AWAITING_APPROVAL]}, 1, 0]}}
                }
            },
            {
                $sort: {"_id.year_month": 1}
            },
            {
                $project: {
                    _id: 0,
                    countOpened: 1,
                    countAcknowledgement: 1,
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
                    data: {$push: {k: "$month_year", v: {o: "$countOpened", a: "$countAcknowledgement"}}}
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
                GIOpenedData[index] = propertyValues[n].o;
                GIAcknowledgementData[index] = propertyValues[n].a;
                n++;
            });

            let monthlyGTResStatus = {
                Months: monthsArray,
                GIOpenedData: GIOpenedData,
                GIAcknowledgementData: GIAcknowledgementData
            };
            return monthlyGTResStatus;
        } else {
            let monthlyGTResStatus = {Months: monthsArray, GIAcknowledgementData: [], GIOpenedData: []};
            return monthlyGTResStatus;
        }
    } catch (error) {
        console.error(error);
    }
};
