const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/dispatch/salesInvoiceModel");
const {default: mongoose} = require("mongoose");
const {
    getFirstDayOfFiscalYear,
    getLastDayOfFiscalYear,
    getFirstDateOfMonth,
    getLastDateOfMonth,
    getFirstDateOfCurrentFiscalYear,
    getLastDateOfCurrentFiscalYear,
    getFiscalMonthsName
} = require("../../../../utilities/utility");
const {getMonthDiffFromCurrentFiscalYear, dateToAnyFormat} = require("../../../../helpers/dateTime");
const {SALES_CATEGORY} = require("../../../../mocks/constantData");
const {OPTIONS} = require("../../../../helpers/global.options");
const {LAKH} = require("../../../../mocks/number.constant");

const ObjectId = mongoose.Types.ObjectId;

exports.getAllNetSalesInvoice = async company => {
    const rows = await Model.aggregate([
        {
            $match: {
                company: ObjectId(company),
                salesInvoiceStatus: {$nin: OPTIONS.defaultStatus.getAllSIDashboardStatusAsArray()}
            }
        },
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$salesInvoiceDate"}}
            }
        },
        {
            $facet: {
                MTDNetSalesInvoice: [
                    {
                        $match: {
                            matchDate: {
                                $gte: dateToAnyFormat(getFirstDateOfMonth(), "YYYY-MM-DD"),
                                $lte: dateToAnyFormat(getLastDateOfMonth(), "YYYY-MM-DD")
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: "Customer",
                            localField: "customer",
                            foreignField: "_id",
                            pipeline: [{$project: {categoryType: 1}}],
                            as: "customer"
                        }
                    },
                    {
                        $unwind: "$customer"
                    },
                    {
                        $match: {
                            "customer.categoryType": SALES_CATEGORY.DOMESTIC
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            amount: {$sum: "$salesInvoiceTotalAmount"}
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            amount: {$round: [{$divide: ["$amount", LAKH]}, 2]}
                        }
                    }
                ],
                YTDNetSalesInvoice: [
                    {
                        $match: {
                            matchDate: {
                                $gte: dateToAnyFormat(getFirstDayOfFiscalYear(), "YYYY-MM-DD"),
                                $lte: dateToAnyFormat(getLastDayOfFiscalYear(), "YYYY-MM-DD")
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: "Customer",
                            localField: "customer",
                            foreignField: "_id",
                            pipeline: [{$project: {categoryType: 1}}],
                            as: "customer"
                        }
                    },
                    {
                        $unwind: "$customer"
                    },
                    {
                        $match: {
                            "customer.categoryType": SALES_CATEGORY.DOMESTIC
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            amount: {$sum: "$salesInvoiceTotalAmount"}
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
        MTDNetSalesInvoice: rows[0]?.MTDNetSalesInvoice[0]?.amount || 0,
        YTDNetSalesInvoice: rows[0]?.YTDNetSalesInvoice[0]?.amount || 0
    };
    return obj;
};

exports.getAvgMonthlyNetSales = async company => {
    const monthDifference = getMonthDiffFromCurrentFiscalYear("months");
    const resultDomestic = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$salesInvoiceDate"}}
            }
        },
        {
            $match: {
                company: ObjectId(company),
                salesInvoiceStatus: {$nin: OPTIONS.defaultStatus.getAllSIDashboardStatusAsArray()},
                matchDate: {
                    $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                    $lte: dateToAnyFormat(getLastDayOfFiscalYear(), "YYYY-MM-DD")
                }
            }
        },
        {
            $lookup: {
                from: "Customer",
                localField: "customer",
                foreignField: "_id",
                pipeline: [{$project: {categoryType: 1}}],
                as: "customer"
            }
        },
        {
            $unwind: "$customer"
        },
        {
            $match: {
                "customer.categoryType": SALES_CATEGORY.DOMESTIC
            }
        },
        {
            $group: {
                _id: null,
                amount: {$sum: "$salesInvoiceTotalAmount"}
            }
        },
        {
            $project: {
                _id: 1,
                amount: {$round: [{$divide: ["$amount", monthDifference]}, 1]}
            }
        }
    ]);
    if (resultDomestic.length > 0) {
        return resultDomestic[0];
    } else {
        return (resultDomestic[0] = {amount: 0});
    }
};
exports.getMonthlyTaxInvoiceTrend = async company => {
    try {
        let monthlyTaxInvoiceTrend = {exports: {}, domestic: {}};
        const monthsArray = getFiscalMonthsName();
        let domesticData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let exportsData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let resultDomestics = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$salesInvoiceDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    salesInvoiceStatus: {$nin: OPTIONS.defaultStatus.getAllSIDashboardStatusAsArray()},
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {categoryType: 1}}],
                    as: "customer"
                }
            },
            {
                $unwind: "$customer"
            },
            {
                $match: {
                    "customer.categoryType": SALES_CATEGORY.DOMESTIC
                }
            },
            {
                $group: {
                    _id: {year_month: {$substrCP: ["$salesInvoiceDate", 0, 7]}},
                    count: {
                        $sum: "$salesInvoiceTotalAmount"
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
        if (resultDomestics.length > 0) {
            const propertyNames = Object.keys(resultDomestics[0].data);
            const propertyValues = Object.values(resultDomestics[0].data);
            let n = 0;
            propertyNames.forEach(elem => {
                let index = monthsArray.indexOf(elem);
                domesticData[index] = (propertyValues[n] / LAKH).toFixed(2);
                n++;
            });

            monthlyTaxInvoiceTrend.domestic = {months: monthsArray, orders: domesticData};
        } else {
            monthlyTaxInvoiceTrend.domestic = {months: monthsArray, orders: []};
        }
        let resultExports = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$salesInvoiceDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    salesInvoiceStatus: {$nin: OPTIONS.defaultStatus.getAllSIDashboardStatusAsArray()},
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {categoryType: 1}}],
                    as: "customer"
                }
            },
            {
                $unwind: "$customer"
            },
            {
                $match: {
                    "customer.categoryType": SALES_CATEGORY.EXPORTS
                }
            },
            {
                $group: {
                    _id: {year_month: {$substrCP: ["$salesInvoiceDate", 0, 7]}},
                    count: {
                        $sum: "$salesInvoiceTotalAmount"
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

            monthlyTaxInvoiceTrend.exports = {months: monthsArray, orders: exportsData};
        } else {
            monthlyTaxInvoiceTrend.exports = {months: monthsArray, orders: []};
        }
        return monthlyTaxInvoiceTrend;
    } catch (error) {
        console.error(error);
    }
};
exports.getTotalTaxableValue = async company => {
    try {
        const result = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$salesInvoiceDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    salesInvoiceStatus: {$nin: OPTIONS.defaultStatus.getAllSIDashboardStatusAsArray()},
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {categoryType: 1}}],
                    as: "customer"
                }
            },
            {
                $match: {
                    "customer.categoryType": SALES_CATEGORY.DOMESTIC
                }
            },
            {
                $group: {
                    _id: null,
                    totalTaxInvoiceValue: {$sum: "$salesInvoiceTotalAmount"}
                }
            },
            {
                $project: {
                    _id: 0,
                    totalTaxInvoiceValue: {$round: [{$divide: ["$totalTaxInvoiceValue", LAKH]}, 2]}
                }
            }
        ]);
        return result[0]?.totalTaxInvoiceValue || 0;
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};
exports.getTotalTaxValue = async company => {
    try {
        const result = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$salesInvoiceDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    salesInvoiceStatus: {$nin: OPTIONS.defaultStatus.getAllSIDashboardStatusAsArray()},
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {categoryType: 1}}],
                    as: "customer"
                }
            },
            {
                $match: {
                    "customer.categoryType": SALES_CATEGORY.DOMESTIC
                }
            },
            {
                $group: {
                    _id: null,
                    totalTaxValue: {
                        $sum: {
                            $add: [
                                "$salesInvoiceTotalCGSTAmount",
                                "$salesInvoiceTotalSGSTAmount",
                                "$salesInvoiceTotalIGSTAmount"
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalTaxValue: {$round: [{$divide: ["$totalTaxValue", LAKH]}, 2]}
                }
            }
        ]);
        return result[0]?.totalTaxValue || 0;
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};
exports.getTopDestination = async company => {
    try {
        const result = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$salesInvoiceDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    salesInvoiceStatus: {$nin: OPTIONS.defaultStatus.getAllSIDashboardStatusAsArray()},
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $group: {
                    _id: "$customerShippingAddress.city",
                    count: {
                        $sum: 1
                    }
                }
            },
            {$sort: {count: -1}},
            {$limit: 1},
            {
                $project: {
                    city: "$_id",
                    count: 1
                }
            }
        ]);
        return result[0]?.city || "-";
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};
exports.getMonthlyTaxInvoiceCountTrend = async company => {
    try {
        let monthlyTaxInvoiceCountTrend = {exports: {}, domestic: {}};
        const monthsArray = getFiscalMonthsName();
        let domesticData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let exportsData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let resultDomestics = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$salesInvoiceDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    salesInvoiceStatus: {$nin: OPTIONS.defaultStatus.getAllSIDashboardStatusAsArray()},
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {categoryType: 1}}],
                    as: "customer"
                }
            },
            {
                $unwind: "$customer"
            },
            {
                $match: {
                    "customer.categoryType": SALES_CATEGORY.DOMESTIC
                }
            },
            {
                $group: {
                    _id: {year_month: {$substrCP: ["$salesInvoiceDate", 0, 7]}},
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
        if (resultDomestics.length > 0) {
            const propertyNames = Object.keys(resultDomestics[0].data);
            const propertyValues = Object.values(resultDomestics[0].data);
            let n = 0;
            propertyNames.forEach(elem => {
                let index = monthsArray.indexOf(elem);
                domesticData[index] = propertyValues[n].toFixed(2);
                n++;
            });

            monthlyTaxInvoiceCountTrend.domestic = {months: monthsArray, orders: domesticData};
        } else {
            monthlyTaxInvoiceCountTrend.domestic = {months: monthsArray, orders: []};
        }
        let resultExports = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$salesInvoiceDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    salesInvoiceStatus: {$nin: OPTIONS.defaultStatus.getAllSIDashboardStatusAsArray()},
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {categoryType: 1}}],
                    as: "customer"
                }
            },
            {
                $unwind: "$customer"
            },
            {
                $match: {
                    "customer.categoryType": SALES_CATEGORY.EXPORTS
                }
            },
            {
                $group: {
                    _id: {year_month: {$substrCP: ["$salesInvoiceDate", 0, 7]}},
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
        if (resultExports.length > 0) {
            const propertyNames = Object.keys(resultExports[0].data);
            const propertyValues = Object.values(resultExports[0].data);
            let n = 0;
            propertyNames.forEach(elem => {
                let index = monthsArray.indexOf(elem);
                exportsData[index] = propertyValues[n].toFixed(2);
                n++;
            });

            monthlyTaxInvoiceCountTrend.exports = {months: monthsArray, orders: exportsData};
        } else {
            monthlyTaxInvoiceCountTrend.exports = {months: monthsArray, orders: []};
        }
        return monthlyTaxInvoiceCountTrend;
    } catch (error) {
        console.error(error);
    }
};
exports.getTopFiveCustomersByValue = async company => {
    try {
        let TopFiveCustomersByValue = {exports: {}, domestic: {}};
        const resultDomestics = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$salesInvoiceDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    salesInvoiceStatus: {$nin: OPTIONS.defaultStatus.getAllSIDashboardStatusAsArray()},
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {categoryType: 1, customerName: 1}}],
                    as: "customer"
                }
            },
            {
                $unwind: "$customer"
            },
            {
                $match: {
                    "customer.categoryType": SALES_CATEGORY.DOMESTIC
                }
            },
            {
                $group: {
                    _id: "$customer.customerName",
                    count: {
                        $sum: "$salesInvoiceTotalAmount"
                    }
                }
            },
            {
                $project: {
                    city: "$_id",
                    count: 1
                }
            },
            {$sort: {count: -1}},
            {$limit: 5}
        ]);
        if (resultDomestics.length > 0) {
            let shipmentCustomer = [];
            let shipmentAmount = [];
            for (const ele of resultDomestics) {
                shipmentCustomer.push(ele.city);
                shipmentAmount.push((Number(ele.count) / LAKH).toFixed(2));
            }
            TopFiveCustomersByValue.domestic = {
                Customer: shipmentCustomer,
                Amount: shipmentAmount
            };
        } else {
            TopFiveCustomersByValue.domestic = {Customer: [], Amount: []};
        }
        const resultExports = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$createdAt"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    SPStatus: {$nin: ["Awaiting Approval", "Rejected"]},
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {categoryType: 1, customerName: 1}}],
                    as: "customer"
                }
            },
            {
                $unwind: "$customer"
            },
            {
                $match: {
                    "customer.categoryType": SALES_CATEGORY.EXPORTS
                }
            },
            {
                $group: {
                    _id: "$customer.customerName",
                    count: {
                        $sum: "$salesInvoiceTotalAmount"
                    }
                }
            },
            {
                $project: {
                    city: "$_id",
                    count: 1
                }
            },
            {$sort: {count: -1}},
            {$limit: 5}
        ]);
        if (resultExports.length > 0) {
            let shipmentCustomer = [];
            let shipmentAmount = [];
            for (const ele of resultExports) {
                shipmentCustomer.push(ele.city);
                shipmentAmount.push((Number(ele.count) / LAKH).toFixed(2));
            }
            TopFiveCustomersByValue.exports = {
                Customer: shipmentCustomer,
                Amount: shipmentAmount
            };
        } else {
            TopFiveCustomersByValue.exports = {Customer: [], Amount: []};
        }
        return TopFiveCustomersByValue;
    } catch (error) {}
};
exports.getTotalNoOfTaxInvoicedPerDay = async company => {
    const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
    const rows = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$salesInvoiceDate"}}
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
                invoiceBookedCountPerDay: {$sum: 1},
                totalTaxInvoicedValueWithoutTax: {$sum: "$salesInvoiceTotalAmount"},
                totalTaxInvoicedValueWithTax: {$sum: "$salesInvoiceTotalTaxAmount"}
            }
        },
        {
            $project: {
                _id: 0,
                invoiceBookedCountPerDay: 1,
                totalTaxInvoicedValueWithoutTax: {$round: [{$divide: ["$totalTaxInvoicedValueWithoutTax", LAKH]}, 2]},
                totalTaxInvoicedValueWithTax: {$round: [{$divide: ["$totalTaxInvoicedValueWithTax", LAKH]}, 2]}
            }
        }
    ]);
    return rows.length > 0 ? rows[0] : [];
};
