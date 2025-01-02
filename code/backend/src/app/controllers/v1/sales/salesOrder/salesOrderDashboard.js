const Model = require("../../../../models/sales/salesOrderModel");
const {default: mongoose} = require("mongoose");
const {
    getFirstDateOfCurrentFiscalYear,
    getLastDateOfCurrentFiscalYear,
    getFirstDayOfFiscalYear,
    getLastDayOfFiscalYear,
    getFirstDateOfMonth,
    getLastDateOfMonth,
    getFiscalMonthsName
} = require("../../../../utilities/utility");
const {SALES_CATEGORY} = require("../../../../mocks/constantData");
const {OPTIONS} = require("../../../../helpers/global.options");
const {getEndDateTime, getStartDateTime, dateToAnyFormat} = require("../../../../helpers/dateTime");
const {LAKH} = require("../../../../mocks/number.constant");
const ObjectId = mongoose.Types.ObjectId;

exports.getTopFiveCustomerSalesOrderData = async company => {
    try {
        let customerSalesOrdersData = {};
        const resultDomestic = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$SODate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    SOStatus: {$nin: OPTIONS.defaultStatus.getAllSODashboardStatusAsArray()},
                    categoryType: SALES_CATEGORY.DOMESTIC,
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {$project: {_id: 1, SONumber: 1, customer: 1, SOTotalAmount: 1}},
            {
                $group: {
                    _id: "$customer",
                    SOTotalAmount: {$sum: "$SOTotalAmount"}
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "_id",
                    foreignField: "_id",
                    as: "deva"
                }
            },
            {$unwind: "$deva"},
            {
                $project: {
                    customerName: "$deva.customerName",
                    SOTotalAmount: 1
                }
            },
            {$sort: {SOTotalAmount: -1}},
            {$limit: 5}
        ]);
        const resultExports = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$SODate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    SOStatus: {$nin: OPTIONS.defaultStatus.getAllSODashboardStatusAsArray()},
                    categoryType: SALES_CATEGORY.EXPORTS,
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {$project: {_id: 1, SONumber: 1, customer: 1, SOTotalAmount: 1}},
            {
                $group: {
                    _id: "$customer",
                    SOTotalAmount: {$sum: "$SOTotalAmount"}
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "_id",
                    foreignField: "_id",
                    as: "deva"
                }
            },
            {$unwind: "$deva"},
            {
                $project: {
                    customerName: "$deva.customerName",
                    SOTotalAmount: 1
                }
            },
            {$sort: {SOTotalAmount: -1}},
            {$limit: 5}
        ]);
        if (resultDomestic.length > 0) {
            let customerArray = [];
            let customerSOAmount = [];
            for (const sod of resultDomestic) {
                customerArray.push(sod.customerName);
                customerSOAmount.push(Number(sod.SOTotalAmount / LAKH).toFixed(2));
            }
            customerSalesOrdersData.domestic = {
                Customers: customerArray,
                SalesOrders: customerSOAmount
            };
        } else {
            customerSalesOrdersData.domestic = {
                Customers: [],
                SalesOrders: []
            };
        }
        if (resultExports.length > 0) {
            let customerArray = [];
            let customerSOAmount = [];
            for (const sod of resultExports) {
                customerArray.push(sod.customerName);
                customerSOAmount.push(Number(sod.SOTotalAmount / LAKH).toFixed(2));
            }
            customerSalesOrdersData.exports = {
                Customers: customerArray,
                SalesOrders: customerSOAmount
            };
        } else {
            customerSalesOrdersData.exports = {
                Customers: [],
                SalesOrders: []
            };
        }
        return customerSalesOrdersData;
    } catch (error) {
        console.error("Error :::::::::::: ", error);
    }
};

exports.getTopFiveOrderedSKUs = async company => {
    let SKUSalesOrdersData = {};
    const resultDomestic = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$SODate"}}
            }
        },
        {
            $match: {
                company: ObjectId(company),
                "SODetails.balancedQty": {$gt: 0},
                SOStatus: {$in: ["Created"]},
                categoryType: SALES_CATEGORY.DOMESTIC,
                matchDate: {
                    $gte: dateToAnyFormat(getFirstDayOfFiscalYear(), "YYYY-MM-DD"),
                    $lte: dateToAnyFormat(getLastDayOfFiscalYear(), "YYYY-MM-DD")
                }
            }
        },
        {$unwind: "$SODetails"},
        {
            $group: {
                _id: "$SODetails.SKU",
                SOTotalAmount: {$sum: "$SODetails.lineValue"}
            }
        },
        {
            $lookup: {
                from: "SKUMaster", //"from collection"
                localField: "_id", //any field from "input collection"
                foreignField: "_id", //any field from "from collection"
                as: "deva" //attached array field
            }
        },
        {$unwind: "$deva"},
        {
            $project: {
                customerName: "$deva.SKUDescription",
                SOTotalAmount: 1
            }
        },
        {$sort: {SOTotalAmount: -1}},
        {$limit: 5}
    ]);
    if (resultDomestic.length > 0) {
        let SKUArray = [];
        let SKUSOAmount = [];
        for (const sod of resultDomestic) {
            SKUArray.push(sod.customerName);
            SKUSOAmount.push((Number(sod.SOTotalAmount) / LAKH).toFixed(2));
        }
        SKUSalesOrdersData.exports = {
            SKU: SKUArray,
            SalesOrders: SKUSOAmount
        };
        SKUSalesOrdersData.domestic = {SKU: SKUArray, SalesOrders: SKUSOAmount};
    } else {
        SKUSalesOrdersData.domestic = {SKU: [], SalesOrders: []};
    }
    const resultExports = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$SODate"}}
            }
        },
        {
            $match: {
                company: ObjectId(company),
                "SODetails.balancedQty": {$gt: 0},
                SOStatus: {$in: ["Created"]},
                matchDate: {
                    $gte: dateToAnyFormat(getFirstDayOfFiscalYear(), "YYYY-MM-DD"),
                    $lte: dateToAnyFormat(getLastDayOfFiscalYear(), "YYYY-MM-DD")
                }
            }
        },
        {$unwind: "$SODetails"},
        {
            $group: {
                _id: "$SODetails.SKU",
                SOTotalAmount: {$sum: "$SODetails.lineValue"}
            }
        },
        {
            $lookup: {
                from: "SKUMaster", //"from collection"
                localField: "_id", //any field from "input collection"
                foreignField: "_id", //any field from "from collection"
                as: "deva" //attached array field
            }
        },
        {$unwind: "$deva"},
        {
            $project: {
                customerName: "$deva.SKUDescription",
                SOTotalAmount: 1
            }
        },
        {$sort: {SOTotalAmount: -1}},
        {$limit: 5}
    ]);
    if (resultExports.length > 0) {
        let SKUArray = [];
        let SKUSOAmount = [];
        for (const sod of resultExports) {
            SKUArray.push(sod.customerName);
            SKUSOAmount.push((Number(sod.SOTotalAmount) / LAKH).toFixed(2));
        }
        SKUSalesOrdersData.exports = {
            SKU: SKUArray,
            SalesOrders: SKUSOAmount
        };
    } else {
        SKUSalesOrdersData.exports = {
            SKU: [],
            SalesOrders: []
        };
    }
    return SKUSalesOrdersData;
};

exports.getSOBalanceValue = async company => {
    try {
        const result = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$SODate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    "SODetails.balancedQty": {$gt: 0},
                    categoryType: SALES_CATEGORY.DOMESTIC,
                    SOStatus: {$nin: OPTIONS.defaultStatus.getAllSODashboardStatusAsArray()}
                    // matchDate: {
                    //     $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                    //     $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    // }
                }
            },
            {$unwind: "$SODetails"},
            {
                $group: {
                    _id: null,
                    SOBalValue: {
                        $sum: {
                            $multiply: ["$SODetails.balancedQty", "$SODetails.netRate"]
                        }
                    }
                }
            },
            {
                $project: {
                    SOBalValue: {$round: [{$divide: ["$SOBalValue", LAKH]}, 2]}
                }
            }
        ]);
        return result[0]?.SOBalValue || 0;
    } catch (error) {
        console.error(error);
    }
};

exports.getAllSOValue = async company => {
    const rows = await Model.aggregate([
        {
            $match: {
                company: ObjectId(company),
                SOStatus: {$nin: OPTIONS.defaultStatus.getAllSODashboardStatusAsArray()},
                categoryType: SALES_CATEGORY.DOMESTIC
            }
        },
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$SODate"}}
            }
        },
        {
            $facet: {
                MTDSOValue: [
                    {
                        $match: {
                            matchDate: {
                                $gte: dateToAnyFormat(getFirstDateOfMonth(), "YYYY-MM-DD"),
                                $lte: dateToAnyFormat(getLastDateOfMonth(), "YYYY-MM-DD")
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            amount: {$sum: "$SOTotalAmount"}
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            amount: {$round: [{$divide: ["$amount", LAKH]}, 2]}
                        }
                    }
                ],
                YTDSOValue: [
                    {
                        $match: {
                            matchDate: {
                                $gte: dateToAnyFormat(getFirstDayOfFiscalYear(), "YYYY-MM-DD"),
                                $lte: dateToAnyFormat(getLastDayOfFiscalYear(), "YYYY-MM-DD")
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            amount: {$sum: "$SOTotalAmount"}
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            amount: {$round: [{$divide: ["$amount", LAKH]}, 2]}
                        }
                    }
                ]
            }
        }
    ]);
    let obj = {
        MTDSOValue: rows[0]?.MTDSOValue[0]?.amount || 0,
        YTDSOValue: rows[0]?.YTDSOValue[0]?.amount || 0
    };
    return obj;
};

exports.getMonthlySalesTrend = async company => {
    try {
        let monthlySalesTrend = {domestic: {}, exports: {}};
        const monthsArray = getFiscalMonthsName();
        const domesticData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const exportsData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const resultDomestic = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$SODate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    SOStatus: {$nin: OPTIONS.defaultStatus.getAllSODashboardStatusAsArray()},
                    categoryType: SALES_CATEGORY.DOMESTIC,
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $group: {
                    _id: {year_month: {$substrCP: ["$SODate", 0, 7]}},
                    countDomestic: {
                        $sum: "$SOTotalAmount"
                    }
                }
            },
            {
                $sort: {"_id.year_month": 1}
            },
            {
                $project: {
                    _id: 0,
                    countDomestic: 1,
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
                    data: {$push: {k: "$month_year", v: "$countDomestic"}}
                }
            },
            {
                $project: {
                    data: {$arrayToObject: "$data"},
                    _id: 0
                }
            }
        ]);
        if (resultDomestic.length > 0) {
            const propertyNames = Object.keys(resultDomestic[0].data);
            const propertyValues = Object.values(resultDomestic[0].data);
            let n = 0;
            propertyNames.forEach(elem => {
                let index = monthsArray.indexOf(elem);
                domesticData[index] = (propertyValues[n] / LAKH).toFixed(2);
                n++;
            });

            monthlySalesTrend.domestic = {months: monthsArray, orders: domesticData};
        } else {
            monthlySalesTrend.domestic = {months: monthsArray, orders: []};
        }
        let resultExports = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$SODate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    SOStatus: {$nin: OPTIONS.defaultStatus.getAllSODashboardStatusAsArray()},
                    categoryType: SALES_CATEGORY.DOMESTIC,
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $group: {
                    _id: {year_month: {$substrCP: ["$SODate", 0, 7]}},
                    count: {
                        $sum: "$SOTotalAmount"
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
        if (resultExports.length > 0) {
            const propertyNames = Object.keys(resultExports[0].data);
            const propertyValues = Object.values(resultExports[0].data);
            let n = 0;
            propertyNames.forEach(elem => {
                let index = monthsArray.indexOf(elem);
                exportsData[index] = (propertyValues[n] / LAKH).toFixed(2);
                n++;
            });

            monthlySalesTrend.exports = {months: monthsArray, orders: exportsData};
        } else {
            monthlySalesTrend.exports = {months: monthsArray, orders: []};
        }
        return monthlySalesTrend;
    } catch (error) {
        console.error(error);
    }
};
exports.getTotalNoOfBookedOrderAndValuePerDay = async company => {
    const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
    let rows = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$SODate"}}
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
                totalNoOfBookedOrderPerDay: {
                    $sum: {$cond: [{$eq: ["$SOStatus", OPTIONS.defaultStatus.CREATED]}, 1, 0]}
                },
                totalBookedValue: {$sum: "$SOTotalAmount"}
            }
        },
        {
            $project: {
                _id: 0,
                totalNoOfBookedOrderPerDay: 1,
                totalBookedValue: {$round: [{$divide: ["$totalBookedValue", LAKH]}, 2]}
            }
        }
    ]);
    rows = {
        totalNoOfBookedOrderPerDay: rows[0]?.totalNoOfBookedOrderPerDay || 0,
        totalBookedValue: rows[0]?.totalBookedValue || 0
    };
    return rows;
};
