const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/sales/salesOrderModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {getMatchData, OPTIONS} = require("../../../../helpers/global.options");
const {getAllSKUs} = require("../SKU/SKU");
const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const {getAllCustomers} = require("../customerMaster/customerMaster");
const {
    getAllMonthName,
    getFirstDateOfCurrentFiscalYear,
    getLastDateOfCurrentFiscalYear,
    getFiscalMonthsName
} = require("../../../../utilities/utility");
const {getAllInvoiceAmountReports} = require("../../dispatch/salesInvoice/salesInvoiceReports");
const {getAllPurchaseAmountReports} = require("../../purchase/purchaseOrder/purchaseOrderReports");
const {getAllReportsAggregationFooter, outputDataReports} = require("../../../../helpers/utility");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const {getQMSMappingByModuleAndTitle} = require("../../settings/report-qms-mapping/report-qms-mapping");
const SalesOrderHelper = require("../../../../models/sales/helpers/salesOrderHelper");
const {LAKH} = require("../../../../mocks/number.constant");
const SORepository = require("../../../../models/sales/repository/salesOrderRepository");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const {filteredSKUMasterList} = require("../../../../models/sales/repository/SKUMasterRepository");
const {
    filteredSubModuleManagementList,
    featureConfig
} = require("../../../../models/settings/repository/subModuleRepository");
exports.getBackSalesOrderBySKU = asyncHandler(async (req, res) => {
    try {
        const {SKU = null} = req.query;
        let project = SalesOrderHelper.getBackSalesOrderBySKUAttributes();
        let query = {
            company: ObjectId(req.user.company),
            "SODetails.balancedQty": {$gt: 0},
            SOStatus: {$nin: ["Created", "Cancelled"]},
            ...(!!SKU && {
                "SODetails.SKU": ObjectId(SKU)
            })
            // SODate: {
            //     $gte: getFirstDateOfCurrentFiscalYear(),
            //     $lte: getLastDateOfCurrentFiscalYear()
            // }
        };
        let pipeline = [
            {$unwind: "$SODetails"},
            {$match: query},
            {
                $group: {
                    _id: "$SODetails.SKU",
                    balanceValue: {
                        $sum: {
                            $multiply: ["$SODetails.balancedQty", "$SODetails.standardRate"]
                        }
                    },
                    balancedQty: {$sum: "$SODetails.balancedQty"}
                }
            },
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "_id",
                    foreignField: "_id",
                    pipeline: [{$project: {SKUName: 1, SKUDescription: 1, SKUNo: 1}}],
                    as: "SKU"
                }
            },
            {$unwind: "$SKU"},
            {
                $match: {
                    ...(!!SKU && {
                        "SKU._id": ObjectId(SKU)
                    })
                }
            },
            {
                $addFields: {
                    balancedQty: {$toString: "$balancedQty"},
                    balanceValue: {$round: ["$balanceValue", 2]}
                }
            }
        ];
        let rows = await SORepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        totalTotalCost: {$sum: {$toDouble: "$balanceValue"}}
                    }
                },
                {
                    $project: {
                        totalTotalCost: {$round: ["$totalTotalCost", 2]},
                        _id: 0
                    }
                }
            ]
        });
        let SKUMasters = await getAllSKUs(req.user.company, {
            SKUNo: 1,
            SKUName: 1,
            SKUDescription: 1
        });
        return res.success({
            SKUMasters,
            ...rows
        });
    } catch (e) {
        console.error("getBackSalesOrderBySKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getBackSalesOrderBySO = asyncHandler(async (req, res) => {
    try {
        const {SKU = null, fromDate = null, toDate = null} = req.query;
        let project = SalesOrderHelper.getBackSalesOrderBySOAttributes();
        let query = {
            company: ObjectId(req.user.company),
            "SODetails.balancedQty": {$gt: 0},
            SOStatus: {$nin: ["Created", "Cancelled"]},
            ...(!!SKU && {
                "SODetails.SKU": {$eq: ObjectId(SKU)}
            }),
            ...(!!toDate &&
                !!fromDate && {
                    SODate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let pipeline = [
            {$unwind: "$SODetails"},
            {$match: query},
            {
                $addFields: {
                    SODateS: {$dateToString: {format: "%d-%m-%Y", date: "$SODate"}},
                    line: {$toString: "$SODetails.SOLineNumber"},
                    balancedQty: {$toString: "$SODetails.balancedQty"},
                    lineValue: {$round: [{$multiply: ["$SODetails.netRate", "$SODetails.balancedQty"]}, 2]},
                    SOLineTargetDateS: {$dateToString: {format: "%d-%m-%Y", date: "$SODetails.SOLineTargetDate"}}
                }
            },
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "SODetails.SKU",
                    foreignField: "_id",
                    pipeline: [{$project: {SKUName: 1, SKUNo: 1, SKUDescription: 1}}],
                    as: "SKU"
                }
            },
            {$unwind: "$SKU"},
            {
                $match: {
                    ...(!!SKU && {
                        "SKU._id": ObjectId(SKU)
                    })
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    as: "customerDetails"
                }
            },
            {$unwind: "$customerDetails"}
        ];
        let rows = await SORepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        SOTotalAmount: {$sum: {$toDouble: "$lineValue"}}
                    }
                },
                {
                    $project: {
                        SOTotalAmount: {$round: ["$SOTotalAmount", 2]},
                        _id: 0
                    }
                }
            ]
        });
        let SKUMasters = await getAllSKUs(req.user.company, {SKUNo: 1, SKUDescription: 1, SKUName: 1});
        return res.success({
            SKUMasters,
            ...rows
        });
    } catch (e) {
        console.error("getBackSalesOrderBySO", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllSOConfirmationReports = asyncHandler(async (req, res) => {
    try {
        const featureConfig = await filteredSubModuleManagementList([
            {
                $match: {
                    _id: ObjectId(req.query.subModuleId)
                }
            },
            {
                $unwind: "$featureConfig"
            },
            {
                $match: {
                    "featureConfig.status": true
                }
            },
            {
                $project: {
                    featureCode: "$featureConfig.featureCode",
                    value: "$featureConfig.value"
                }
            }
        ]);
        let customers = await getAllCustomers(req.user.company, {customerName: 1, company: 0});
        const {customer = null, fromDate = null, toDate = null} = req.query;
        let project = SalesOrderHelper.getAllSOConfirmationReportsAttributes();
        let query = {
            company: ObjectId(req.user.company),
            SOStatus: {$nin: ["Created"]},
            ...(!!customer && {
                customer: {$eq: ObjectId(customer)}
            }),
            ...(!!toDate &&
                !!fromDate && {
                    matchDate: {
                        $lte: toDate,
                        $gte: fromDate
                    }
                })
        };
        let pipeline = [
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$SODate"}}
                }
            },
            {
                $match: query
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {customerName: 1}}],
                    as: "customer"
                }
            },
            {$unwind: "$customer"}
        ];
        let rows = await SORepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        SOTotalAmount: {$sum: {$toDouble: "$SOTotalAmount"}}
                    }
                },
                {
                    $project: {
                        SOTotalAmount: {$round: ["$SOTotalAmount", 2]},
                        _id: 0
                    }
                }
            ]
        });
        return res.success({
            customers,
            featureConfig,
            ...rows
        });
    } catch (e) {
        console.error("getAllSOConfirmationReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllSOCostAnalysisReports = asyncHandler(async (req, res) => {
    try {
        const SKU = await getAllSKUs(req.user.company, {SKUName: 1});
        const customers = await getAllCustomers(req.user.company, {customerName: 1, company: 0});
        const {customerId = null, fromDate = null, toDate = null, SKUId = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!customerId && {
                customer: ObjectId(customerId)
            }),
            ...(!!toDate &&
                !!fromDate && {
                    SODate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = SalesOrderHelper.getAllSOCostAnalysisReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {$unwind: "$SODetails"},
            {
                $project: {
                    SODate: 1,
                    customer: 1,
                    currency: 1,
                    SKU: "$SODetails.SKU",
                    SOQty: "$SODetails.orderedQty",
                    standardRate: "$SODetails.standardRate",
                    lineValue: "$SODetails.lineValue"
                }
            },
            {
                $group: {
                    _id: {SKU: "$SKU", customer: "$customer"},
                    currency: {$first: "$currency"},
                    SODateMin: {$min: "$SODate"},
                    SODateMax: {$max: "$SODate"},
                    totalOrders: {$sum: 1},
                    totalTotalCost: {$sum: "$lineValue"},
                    averageCost: {$avg: "$lineValue"},
                    minCost: {$min: "$lineValue"},
                    maxCost: {$max: "$lineValue"}
                }
            },
            {
                $project: {
                    SKU: "$_id.SKU",
                    customer: "$_id.customer",
                    currency: 1,
                    SODateMin: 1,
                    SODateMax: 1,
                    totalOrders: 1,
                    totalTotalCost: 1,
                    averageCost: 1,
                    minCost: 1,
                    maxCost: 1
                }
            },
            {
                $match: {
                    ...(!!SKUId && {
                        SKU: ObjectId(SKUId)
                    })
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, customerName: 1}}],
                    as: "customer"
                }
            },
            {$unwind: "$customer"},
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "SKU",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, SKUName: 1}}],
                    as: "SKU"
                }
            },
            {$unwind: "$SKU"}
        ];
        let rows = await SORepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        totalTotalCost: {$sum: "$totalTotalCost"}
                    }
                },
                {
                    $project: {
                        totalTotalCost: {$round: ["$totalTotalCost", 2]},
                        _id: 0
                    }
                }
            ]
        });

        return res.success({
            customers,
            SKU,
            ...rows
        });
    } catch (e) {
        console.error("getAllSOCostAnalysisReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllSalesTrendAnalysisReports = async (reqQuery, company) => {
    const months = getAllMonthName();
    try {
        const {
            search = null,
            excel = "false",
            page = 1,
            pageSize = 10,
            column = "createdAt",
            direction = -1,
            fromDate = null,
            toDate = null
        } = reqQuery;
        let skip = Math.max(0, page - 1) * pageSize;
        let project = {
            month: 1,
            YYYY: "$_id.YYYY",
            SOTotalAmount: 1,
            MM: "$_id.MM"
        };
        let match = await getMatchData(project, search);
        let query = {
            company: ObjectId(company),
            SOStatus: {$in: ["Invoiced", "Closed", "Report Generated"]},
            ...(!!toDate &&
                !!fromDate && {
                    SODate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let pagination = [];
        if (excel == "false") {
            pagination = [{$skip: +skip}, {$limit: +pageSize}];
        }
        let rows = await Model.aggregate([
            {
                $match: query
            },
            {
                $project: {
                    SODate: 1,
                    SOTotalAmount: 1,
                    MM: {$month: "$SODate"},
                    YYYY: {$year: "$SODate"}
                }
            },

            {
                $group: {
                    _id: {MM: "$MM", YYYY: "$YYYY"},
                    amount: {$sum: "$SOTotalAmount"}
                }
            },
            {
                $addFields: {
                    SOTotalAmount: {$toString: {$round: ["$amount", 2]}},
                    month: {
                        $arrayElemAt: [months, {$subtract: ["$_id.MM", 1]}]
                    }
                }
            },
            {$sort: {"_id.YYYY": -1, "_id.MM": -1}},
            ...getAllReportsAggregationFooter(project, match, column, direction, pagination, [
                {
                    $group: {
                        _id: null,
                        SOTotalAmount: {$sum: {$toDouble: "$SOTotalAmount"}}
                    }
                },
                {
                    $project: {
                        SOTotalAmount: {$round: ["$SOTotalAmount", 2]},
                        _id: 0
                    }
                }
            ])
        ]);
        return {
            ...outputDataReports(rows)
        };
    } catch (e) {
        console.error("getAllSalesTrendAnalysisReports", e);
    }
};
exports.getAllSalesAmountReports = async company => {
    try {
        const monthsArray = getFiscalMonthsName();
        const salesAmount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const result = await Model.aggregate([
            {
                $match: {
                    company: ObjectId(company),
                    SOStatus: {$in: ["Invoiced", "Closed", "Report Generated"]},
                    SODate: {
                        $gte: getFirstDateOfCurrentFiscalYear(),
                        $lte: getLastDateOfCurrentFiscalYear()
                    }
                }
            },
            {
                $group: {
                    _id: {year_month: {$substrCP: ["$SODate", 0, 7]}},
                    totalAmount: {$sum: "$SOTotalAmount"}
                }
            },
            {
                $sort: {"_id.year_month": 1}
            },
            {
                $project: {
                    _id: 0,
                    totalAmount: 1,
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
                    data: {$push: {k: "$month_year", v: "$totalAmount"}}
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
                salesAmount[index] = (propertyValues[n] / LAKH).toFixed(2);
                n++;
            });
            monthlySales = {Months: monthsArray, Orders: salesAmount};
        } else {
            monthlySales = {Months: monthsArray, Orders: salesAmount};
        }
        return monthlySales;
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};

exports.getAllPurchaseVsInvoiceReports = asyncHandler(async (req, res) => {
    try {
        invoiceAmount = await getAllInvoiceAmountReports(req.user.company);
        purchaseAmount = await getAllPurchaseAmountReports(req.user.company);
        salesAmount = await this.getAllSalesAmountReports(req.user.company);
        let allAmounts = [];
        let invoicesTotal = 0;
        let purchaseTotal = 0;
        for (let i = 0; i < monthlySales.Months.length; i++) {
            invoicesTotal = invoicesTotal + +invoiceAmount[i];
            purchaseTotal = purchaseTotal + +purchaseAmount[i];
            allAmounts.push({
                months: salesAmount.Months[i],
                purchase: purchaseAmount[i],
                ordersBooked: salesAmount.Orders[i],
                invoices: invoiceAmount[i]
            });
        }
        let purchaseToInvoicePercentage = +((+purchaseTotal / +invoicesTotal) * 100).toFixed(2);
        return res.success({
            allAmounts,
            invoicesTotal: +invoicesTotal.toFixed(2),
            purchaseTotal: +purchaseTotal.toFixed(2),
            purchaseToInvoicePercentage
        });
    } catch (error) {
        console.error("Not able to get record ", error);
    }
});
exports.getAllSalesOrderReports = asyncHandler(async (req, res) => {
    try {
        const {customerId = null, SKUId = null, toDate = null} = req.query;
        let project = SalesOrderHelper.getAllSalesOrderReportsAttributes();
        let query = {
            company: ObjectId(req.user.company),
            SOStatus: OPTIONS.defaultStatus.REPORT_GENERATED,
            ...(!!customerId && {
                customer: ObjectId(customerId)
            }),
            ...(!!toDate && {
                SODate: {
                    $lte: getEndDateTime(toDate)
                }
            })
        };
        let pipeline = [
            {$match: query},
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {customerName: 1, customerNickName: 1}}],
                    as: "customer"
                }
            },
            {$unwind: "$customer"},
            {$unwind: "$SODetails"},
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "SODetails.SKU",
                    foreignField: "_id",
                    pipeline: [{$project: {SKUName: 1, SKUDescription: 1, SKUNo: 1}}],
                    as: "SODetails.SKU"
                }
            },
            {$unwind: "$SODetails.SKU"},
            {
                $match: {
                    ...(!!SKUId && {
                        "SODetails.SKU._id": ObjectId(SKUId)
                    })
                }
            },
            {
                $addFields: {
                    dispatchSchedule: {
                        $cond: {
                            if: {
                                $and: [
                                    {$not: [["$SODetails.dispatchSchedule"]]},
                                    {$gt: [{$size: "$SODetails.dispatchSchedule"}, 0]}
                                ]
                            },
                            then: "$SODetails.dispatchSchedule",
                            else: [
                                {
                                    scheduleNo: 1,
                                    quantity: "$SODetails.orderedQty",
                                    dispatchDate: {
                                        $dateToString: {format: "%d-%m-%Y", date: "$SODetails.SOLineTargetDate"}
                                    }
                                }
                            ]
                        }
                    }
                }
            },
            {
                $unwind: {
                    path: "$dispatchSchedule",
                    preserveNullAndEmptyArrays: true
                }
            }
        ];
        let rows = await SORepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        SOTotalAmount: {$sum: {$toDouble: "$lineValue"}},
                        SOQty: {$sum: {$toDouble: "$quantity"}}
                    }
                },
                {
                    $project: {
                        SOTotalAmount: {$round: ["$SOTotalAmount", 2]},
                        SOQty: {$round: ["$SOQty", 2]},
                        _id: 0
                    }
                }
            ]
        });
        let SKUList = await getAllSKUs(req.user.company, {SKUName: 1});
        let customerList = await getAllCustomers(req.user.company, {customerName: 1, company: 0});
        const displayText = await getQMSMappingByModuleAndTitle(req.user.company, "Sales", "Sales Order");
        return res.success({
            SKUList,
            customerList,
            displayText,
            ...rows
        });
    } catch (e) {
        console.error("getAllSalesOrderReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllSalesOrderStatusReports = asyncHandler(async (req, res) => {
    try {
        let monthValue = await featureConfig(null, true, "SOSR_CONFIGURABLE_MONTH_VALUE");
        monthValue = monthValue?.length ? monthValue[0].value : 0;
        const {customerId = null, toDate = null} = req.query;
        const sixMonthsAgoDate = new Date();
        sixMonthsAgoDate.setMonth(sixMonthsAgoDate.getMonth() - parseInt(monthValue));
        let project = SalesOrderHelper.getAllSalesOrderStatusReportsAttributes();
        let query = {
            company: ObjectId(req.user.company),
            SOStatus: OPTIONS.defaultStatus.REPORT_GENERATED,
            ...(!!customerId && {
                customer: ObjectId(customerId)
            }),
            ...(!!toDate && {
                SODate: {
                    $lte: getEndDateTime(toDate),
                    $gte: sixMonthsAgoDate
                }
            }),
            "SODetails.balancedQty": {$gt: 0}
        };
        let pipeline = [
            {$match: query},
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {customerName: 1, customerNickName: 1}}],
                    as: "customer"
                }
            },
            {$unwind: "$customer"},
            {$unwind: "$SODetails"},
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "SODetails.SKU",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                SKUName: 1,
                                SKUDescription: 1,
                                SKUNo: 1,
                                "customerInfo.customer": 1,
                                "customerInfo.standardSellingRate": 1
                            }
                        }
                    ],
                    as: "SODetails.SKU"
                }
            },
            {$unwind: "$SODetails.SKU"},
            {
                $addFields: {
                    selectedCustomerInfo: {
                        $filter: {
                            input: "$SODetails.SKU.customerInfo",
                            as: "customerInfo",
                            cond: {$eq: ["$$customerInfo.customer", "$customer._id"]}
                        }
                    }
                }
            },
            {
                $unwind: {
                    path: "$selectedCustomerInfo",
                    preserveNullAndEmptyArrays: true
                }
            }
        ];
        let rows = await SORepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        SOValue: {$sum: {$toDouble: "$lineValue"}}
                    }
                },
                {
                    $project: {
                        SOValue: {$round: ["$SOValue", 2]},
                        _id: 0
                    }
                }
            ]
        });
        let customerList = await getAllCustomers(req.user.company, {customerName: 1, company: 0});
        const displayText = await getQMSMappingByModuleAndTitle(req.user.company, "Sales", "Sales Order Status");
        return res.success({
            customerList,
            displayText,
            ...rows
        });
    } catch (e) {
        console.error("getAllSalesOrderStatusReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getSOLineWise = asyncHandler(async (req, res) => {
    try {
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
        const {customer = null, fromDate = null, toDate = null} = req.query;
        let project = SalesOrderHelper.getSOLineWiseAttributes();
        let query = {
            company: ObjectId(req.user.company),
            "SODetails.balancedQty": {$gt: 0},
            SOStatus: {$nin: ["Created", "Cancelled"]},
            ...(!!customer && {
                customer: {$eq: ObjectId(customer)}
            }),
            ...(!!toDate &&
                !!fromDate && {
                    SODate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let pipeline = [
            {$unwind: "$SODetails"},
            {$match: query},
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "SODetails.SKU",
                    foreignField: "_id",
                    pipeline: [{$project: {SKUName: 1, SKUNo: 1, SKUDescription: 1}}],
                    as: "SKU"
                }
            },
            {$unwind: "$SKU"},
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {customerName: 1}}],
                    as: "customerDetails"
                }
            },
            {$unwind: "$customerDetails"}
        ];
        let rows = await SORepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            customerOptions,
            ...rows
        });
    } catch (e) {
        console.error("getSOLineWise", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
