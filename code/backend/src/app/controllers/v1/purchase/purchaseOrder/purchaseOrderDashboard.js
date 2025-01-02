const Model = require("../../../../models/purchase/purchaseOrderModel");
const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const {
    getFirstDateOfCurrentFiscalYear,
    getFirstDateOfMonth,
    getLastDateOfCurrentFiscalYear,
    getLastDateOfMonth,
    getFirstDayOfFiscalYear,
    getLastDayOfFiscalYear,
    getFiscalMonthsName
} = require("../../../../utilities/utility");
const {getEndDateTime, getStartDateTime, dateToAnyFormat} = require("../../../../helpers/dateTime");
const {LAKH} = require("../../../../mocks/number.constant");

exports.getYTDNetPurchase = async company => {
    const rows = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$PODate"}}
            }
        },
        {
            $match: {
                company: ObjectId(company),
                POStatus: {
                    $nin: ["Awaiting Approval", "Cancelled", "Rejected"]
                },
                matchDate: {
                    $gte: dateToAnyFormat(getFirstDayOfFiscalYear(), "YYYY-MM-DD"),
                    $lte: dateToAnyFormat(getLastDayOfFiscalYear(), "YYYY-MM-DD")
                }
            }
        },
        {
            $facet: {
                YTDNetPurchaseDomestic: [
                    {$match: {purchaseCategory: {$regex: /Domestic/i}}},
                    {
                        $group: {
                            _id: null,
                            amount: {$sum: "$netPOValue"}
                        }
                    },
                    {
                        $project: {
                            amount: {$round: [{$divide: ["$amount", LAKH]}, 2]}
                        }
                    }
                ],
                YTDNetPurchaseImports: [
                    {$match: {purchaseCategory: {$regex: /Imports/i}}},
                    {
                        $group: {
                            _id: null,
                            amount: {$sum: "$netPOValue"}
                        }
                    },
                    {
                        $project: {
                            amount: {$round: [{$divide: ["$amount", LAKH]}, 2]}
                        }
                    }
                ]
            }
        }
    ]);
    let obj = {
        YTDNetPurchaseDomestic: rows[0]?.YTDNetPurchaseDomestic[0]?.amount || 0,
        YTDNetPurchaseImports: rows[0]?.YTDNetPurchaseImports[0]?.amount || 0
    };
    return obj;
};
exports.getMTDNetPurchase = async company => {
    const rows = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$PODate"}}
            }
        },
        {
            $match: {
                company: ObjectId(company),
                POStatus: {
                    $nin: ["Awaiting Approval", "Cancelled", "Rejected"]
                },
                matchDate: {
                    $gte: dateToAnyFormat(getFirstDateOfMonth(), "YYYY-MM-DD"),
                    $lte: dateToAnyFormat(getLastDateOfMonth(), "YYYY-MM-DD")
                }
            }
        },
        {
            $facet: {
                MTDNetPurchaseDomestic: [
                    {
                        $match: {purchaseCategory: {$regex: /Domestic/i}}
                    },
                    {
                        $group: {
                            _id: null,
                            amount: {$sum: "$netPOValue"}
                        }
                    },
                    {
                        $project: {
                            amount: {$round: [{$divide: ["$amount", LAKH]}, 2]}
                        }
                    }
                ],
                MTDNetPurchaseImports: [
                    {$match: {purchaseCategory: {$regex: /Imports/i}}},
                    {
                        $group: {
                            _id: null,
                            amount: {$sum: "$netPOValue"}
                        }
                    },
                    {
                        $project: {
                            amount: {$round: [{$divide: ["$amount", LAKH]}, 2]}
                        }
                    }
                ]
            }
        }
    ]);
    let obj = {
        MTDNetPurchaseDomestic: rows[0]?.MTDNetPurchaseDomestic[0]?.amount || 0,
        MTDNetPurchaseImports: rows[0]?.MTDNetPurchaseImports[0]?.amount || 0
    };
    return obj;
};

exports.getPPVData = async company => {
    let result = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$PODate"}}
            }
        },
        {
            $match: {
                company: ObjectId(company),
                matchDate: {
                    $gte: dateToAnyFormat(getFirstDayOfFiscalYear(), "YYYY-MM-DD"),
                    $lte: dateToAnyFormat(getLastDayOfFiscalYear(), "YYYY-MM-DD")
                }
            }
        },
        {$unwind: "$PODetails"},
        {
            $project: {
                POQty: "$PODetails.POQty",
                standardRate: "$PODetails.standardRate",
                purchaseRate: "$PODetails.purchaseRate"
            }
        },
        {$match: {$expr: {$ne: ["$purchaseRate", "$standardRate"]}}},
        {
            $addFields: {
                PPVValue: {$multiply: ["$POQty", {$subtract: ["$standardRate", "$purchaseRate"]}]}
            }
        },
        {
            $group: {
                _id: null,
                PPV: {$sum: "$PPVValue"},
                totalPurchaseRate: {$sum: "$purchaseRate"},
                totalStandardRate: {$sum: "$standardRate"}
            }
        },
        {
            $facet: {
                PPVTotal: [
                    {
                        $project: {
                            totalSum: {$round: [{$divide: ["$PPV", LAKH]}, 2]},
                            _id: 0
                        }
                    }
                ],
                PPVRatio: [
                    {
                        $project: {
                            PPVRatio: {
                                $round: [
                                    {
                                        $multiply: [
                                            {
                                                $divide: [
                                                    {
                                                        $subtract: ["$totalStandardRate", "$totalPurchaseRate"]
                                                    },
                                                    "$totalStandardRate"
                                                ]
                                            },
                                            100
                                        ]
                                    },
                                    2
                                ]
                            }
                        }
                    }
                ]
            }
        }
    ]);
    result = {
        PPVTotal: result[0]?.PPVTotal[0]?.totalSum || 0,
        PPVRatio: result[0]?.PPVRatio[0]?.PPVRatio || 0
    };
    return result;
};
exports.getTopFiveSupplierPurchaseOrderData = async company => {
    try {
        let supplierPurchaseOrdersData = {imports: {}, domestic: {}};
        const result = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$PODate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    POStatus: {
                        $nin: ["Awaiting Approval", "Cancelled", "Rejected"]
                    },
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {$project: {_id: 1, PONumber: 1, supplier: 1, PODetails: 1, purchaseCategory: 1}},
            {$unwind: "$PODetails"},
            {
                $facet: {
                    domesticSupplierPurchase: [
                        {$match: {purchaseCategory: {$regex: /Domestic/i}}},
                        {
                            $group: {
                                _id: "$supplier",
                                purchaseCategory: {$first: "$purchaseCategory"},
                                lineValue: {$sum: "$PODetails.lineValue"}
                            }
                        },
                        {
                            $lookup: {
                                from: "Supplier",
                                localField: "_id",
                                foreignField: "_id",
                                as: "supplier"
                            }
                        },
                        {$unwind: "$supplier"},
                        {
                            $project: {
                                supplierName: "$supplier.supplierName",
                                lineValue: 1
                            }
                        },
                        {$sort: {lineValue: -1}},
                        {$limit: 5}
                    ],
                    importsSupplierPurchase: [
                        {$match: {purchaseCategory: {$regex: /Imports/i}}},
                        {
                            $group: {
                                _id: "$supplier",
                                purchaseCategory: {$first: "$purchaseCategory"},
                                lineValue: {$sum: "$PODetails.lineValue"}
                            }
                        },
                        {
                            $lookup: {
                                from: "Supplier",
                                localField: "_id",
                                foreignField: "_id",
                                as: "supplier"
                            }
                        },
                        {$unwind: "$supplier"},
                        {
                            $project: {
                                supplierName: "$supplier.supplierName",
                                lineValue: 1
                            }
                        },
                        {$sort: {lineValue: -1}},
                        {$limit: 5}
                    ]
                }
            }
        ]);
        if (result.length > 0) {
            supplierPurchaseOrdersData.domestic = {suppliers: [], purchase: []};
            supplierPurchaseOrdersData.imports = {suppliers: [], purchase: []};
            suppPOAmount = [];
            for (const sod of result[0]?.domesticSupplierPurchase) {
                supplierPurchaseOrdersData.domestic.suppliers.push(sod.supplierName);
                supplierPurchaseOrdersData.domestic.purchase.push((Number(sod.lineValue) / LAKH).toFixed(2));
            }
            for (const sod of result[0]?.importsSupplierPurchase) {
                supplierPurchaseOrdersData.imports.suppliers.push(sod.supplierName);
                supplierPurchaseOrdersData.imports.purchase.push((Number(sod.lineValue) / LAKH).toFixed(2));
            }
        }
        return supplierPurchaseOrdersData;
    } catch (error) {
        console.error(error);
    }
};
exports.getTopFiveOrderedItems = async company => {
    try {
        let itemPurchaseOrderData = {imports: {}, domestic: {}};
        const result = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$PODate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    POStatus: {
                        $nin: ["Awaiting Approval", "Cancelled", "Rejected"]
                    },
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {$unwind: "$PODetails"},
            {
                $facet: {
                    importsItemPurchase: [
                        {
                            $match: {
                                purchaseCategory: {$regex: /Imports/i}
                            }
                        },
                        {
                            $group: {
                                _id: "$PODetails.item",
                                netPOValue: {$sum: "$PODetails.lineValue"}
                            }
                        },
                        {
                            $lookup: {
                                from: "Items",
                                localField: "_id",
                                foreignField: "_id",
                                as: "deva"
                            }
                        },
                        {$unwind: "$deva"},
                        {
                            $project: {
                                custName: "$deva.itemName",
                                netPOValue: 1
                            }
                        },
                        {$sort: {netPOValue: -1}},
                        {$limit: 5}
                    ],
                    domesticItemPurchase: [
                        {
                            $match: {
                                purchaseCategory: {$regex: /Domestic/i}
                            }
                        },
                        {
                            $group: {
                                _id: "$PODetails.item",
                                netPOValue: {$sum: "$PODetails.lineValue"}
                            }
                        },
                        {
                            $lookup: {
                                from: "Items",
                                localField: "_id",
                                foreignField: "_id",
                                as: "deva"
                            }
                        },
                        {$unwind: "$deva"},
                        {
                            $project: {
                                custName: "$deva.itemName",
                                netPOValue: 1
                            }
                        },
                        {$sort: {netPOValue: -1}},
                        {$limit: 5}
                    ]
                }
            }
        ]);
        if (result.length > 0) {
            itemPurchaseOrderData.domestic = {items: [], purchase: []};
            itemPurchaseOrderData.imports = {items: [], purchase: []};
            for (const sod of result[0].domesticItemPurchase) {
                itemPurchaseOrderData.domestic.items.push(sod.custName);
                itemPurchaseOrderData.domestic.purchase.push((Number(sod.netPOValue) / LAKH).toFixed(2));
            }
            for (const sod of result[0].importsItemPurchase) {
                itemPurchaseOrderData.imports.items.push(sod.custName);
                itemPurchaseOrderData.imports.purchase.push((Number(sod.netPOValue) / LAKH).toFixed(2));
            }
        }
        return itemPurchaseOrderData;
    } catch (error) {
        console.error(error);
    }
};
exports.getMonthlyDomesticPurchaseOrderData = async company => {
    try {
        const monthsArray = getFiscalMonthsName();
        const DPOData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const totalSumData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const result = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$PODate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    purchaseCategory: "Domestic",
                    POStatus: {
                        $nin: ["Awaiting Approval", "Cancelled", "Rejected"]
                    },
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $group: {
                    _id: {year_month: {$substrCP: ["$PODate", 0, 7]}},
                    totalSum: {$sum: "$netPOValue"},
                    count: {$sum: 1}
                }
            },
            {
                $sort: {"_id.year_month": 1}
            },
            {
                $project: {
                    _id: 0,
                    count: 1,
                    totalSum: 1,
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
                    countData: {$push: {k: "$month_year", v: "$count"}},
                    totalSumData: {$push: {k: "$month_year", v: "$totalSum"}}
                }
            },
            {
                $project: {
                    totalSumData: {$arrayToObject: "$totalSumData"},
                    countData: {$arrayToObject: "$countData"},
                    _id: 0
                }
            }
        ]);
        if (result.length > 0) {
            const propertyNames = Object.keys(result[0].countData);
            const propertyValues = Object.values(result[0].countData);
            const totalSumValues = Object.values(result[0].totalSumData);
            let n = 0;
            propertyNames.forEach(elem => {
                let index = monthsArray.indexOf(elem);
                DPOData[index] = propertyValues[n];
                totalSumData[index] = (totalSumValues[n] / LAKH).toFixed(2);
                n++;
            });

            let monthlyDomesticPurchaseOrderData = {
                months: monthsArray,
                ordersCount: DPOData,
                totalOrderSum: totalSumData
            };
            return monthlyDomesticPurchaseOrderData;
        } else {
            let monthlyDomesticPurchaseOrderData = {months: monthsArray, ordersCount: [], totalOrderSum: []};
            return monthlyDomesticPurchaseOrderData;
        }
    } catch (error) {
        console.error(error);
    }
};
exports.getMonthlyImportsPurchaseOrderData = async company => {
    try {
        const monthsArray = getFiscalMonthsName();
        const DPOData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const totalSumData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const result = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$PODate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    purchaseCategory: "Imports",
                    POStatus: {
                        $nin: ["Awaiting Approval", "Cancelled", "Rejected"]
                    },
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $group: {
                    _id: {year_month: {$substrCP: ["$PODate", 0, 7]}},
                    totalSum: {$sum: "$netPOValue"},
                    count: {$sum: 1}
                }
            },
            {
                $sort: {"_id.year_month": 1}
            },
            {
                $project: {
                    _id: 0,
                    count: 1,
                    totalSum: 1,
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
                    data: {$push: {k: "$month_year", v: "$count"}},
                    totalSumData: {$push: {k: "$month_year", v: "$totalSum"}}
                }
            },
            {
                $project: {
                    totalSumData: {$arrayToObject: "$totalSumData"},
                    countData: {$arrayToObject: "$data"},
                    _id: 0
                }
            }
        ]);
        if (result.length > 0) {
            const propertyNames = Object.keys(result[0].countData);
            const propertyValues = Object.values(result[0].countData);
            const totalSumValues = Object.values(result[0].totalSumData);
            let n = 0;
            propertyNames.forEach(elem => {
                let index = monthsArray.indexOf(elem);
                DPOData[index] = propertyValues[n];
                totalSumData[index] = (totalSumValues[n] / LAKH).toFixed(2);
                n++;
            });

            let monthlyImportsPurchaseOrderData = {
                months: monthsArray,
                ordersCount: DPOData,
                totalOrderSum: totalSumData
            };
            return monthlyImportsPurchaseOrderData;
        } else {
            let monthlyImportsPurchaseOrderData = {months: monthsArray, ordersCount: [], totalOrderSum: []};
            return monthlyImportsPurchaseOrderData;
        }
    } catch (error) {
        console.error(error);
    }
};
exports.getTotalNoOfPurchaseOrderPerDay = async company => {
    const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
    const rows = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$PODate"}}
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
                totalPurchaseOrders: {$sum: 1},
                totalPOValue: {$sum: "$netPOValue"}
            }
        },
        {
            $project: {
                _id: 0,
                totalPurchaseOrders: 1,
                totalPOValue: {$round: ["$totalPOValue", 2]}
            }
        }
    ]);
    let obj = {
        totalPurchaseOrders: rows[0]?.totalPurchaseOrders || 0,
        totalPOValue: rows[0]?.totalPOValue || 0
    };
    return obj;
};
