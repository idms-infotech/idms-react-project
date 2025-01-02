const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/purchase/purchaseOrderModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {OPTIONS} = require("../../../../helpers/global.options");
const {getAllItems} = require("../items/items");
const {getAllSuppliers} = require("../suppliers/suppliers");
const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const {
    getFirstDateOfCurrentFiscalYear,
    getLastDateOfCurrentFiscalYear,
    getFiscalMonthsName
} = require("../../../../utilities/utility");
const {getAllItemCategory} = require("../itemCategoryMaster/itemCategoryMaster");
const {getEndDateTime, getStartDateTime, dateToAnyFormat} = require("../../../../helpers/dateTime");
const {ITEM_CATEGORY_OPTIONS, OTHER_CHARGES_SAC_CODE} = require("../../../../mocks/constantData");
const PurchaseOrderHelper = require("../../../../models/purchase/helpers/purchaseOrderHelper");
const {getSACObj} = require("../SAC/SAC");
const {LAKH} = require("../../../../mocks/number.constant");
const PORepository = require("../../../../models/purchase/repository/purchaseOrderRepository");

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const suppliers = await getAllSuppliers(req.user.company, {supplierName: 1});
        const {supplier = null, toDate = null, fromDate = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            POStatus: {
                $nin: OPTIONS.defaultStatus.getAllFilterStatusArray(["AWAITING_APPROVAL", "APPROVED", "REJECTED"])
            },
            ...(!!supplier && {
                supplier: ObjectId(supplier)
            }),
            ...(!!toDate &&
                !!fromDate && {
                    PODate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let SACObj = await getSACObj(OTHER_CHARGES_SAC_CODE);
        let project = PurchaseOrderHelper.getAllPurchaseOrderReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $addFields: {
                    PODateS: {$dateToString: {format: "%d-%m-%Y", date: "$PODate"}}
                }
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                _id: 0,
                                supplierName: 1,
                                supplierGST: 1,
                                exportsCategory: {
                                    $regexMatch: {input: "$categoryType", regex: /imports/, options: "i"}
                                }
                            }
                        }
                    ],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"},
            {
                $lookup: {
                    from: "Company",
                    localField: "company",
                    foreignField: "_id",
                    let: {deliveryLocation: "$deliveryLocation"},
                    pipeline: [
                        {$unwind: "$placesOfBusiness"},
                        {$match: {$expr: {$eq: ["$$deliveryLocation", "$placesOfBusiness.locationID"]}}},
                        {$project: {_id: 0, GSTINForAdditionalPlace: "$placesOfBusiness.GSTINForAdditionalPlace"}}
                    ],
                    as: "company"
                }
            },
            {$unwind: "$company"},
            {
                $addFields: {
                    locationCond: {
                        $cond: [
                            {
                                $and: [{$eq: ["$company.GSTINForAdditionalPlace", "supplier.supplierGST"]}]
                            },
                            true,
                            false
                        ]
                    }
                }
            },
            {
                $addFields: {
                    GSTAmount: {
                        $cond: [
                            {$eq: ["$supplier.exportsCategory", true]},
                            0,
                            {
                                $divide: [
                                    {
                                        $reduce: {
                                            input: "$PODetails",
                                            initialValue: 0,
                                            in: {
                                                $sum: [
                                                    "$$value",
                                                    {
                                                        $sum: [
                                                            {
                                                                $cond: [
                                                                    {$eq: ["$locationCond", true]},
                                                                    [
                                                                        {
                                                                            $multiply: [
                                                                                "$$this.sgst",
                                                                                "$$this.lineValue"
                                                                            ]
                                                                        },
                                                                        {$multiply: ["$$this.cgst", "$$this.lineValue"]}
                                                                    ],
                                                                    {$multiply: ["$$this.igst", "$$this.lineValue"]}
                                                                ]
                                                            },
                                                            {
                                                                $cond: [
                                                                    {$gt: ["$otherCharges.totalAmount", 0]},
                                                                    {
                                                                        $cond: [
                                                                            {$eq: ["$locationCond", true]},
                                                                            [
                                                                                {
                                                                                    $multiply: [
                                                                                        SACObj?.sgstRate,
                                                                                        "$otherCharges.totalAmount"
                                                                                    ]
                                                                                },
                                                                                {
                                                                                    $multiply: [
                                                                                        SACObj?.cgstRate,
                                                                                        "$otherCharges.totalAmount"
                                                                                    ]
                                                                                }
                                                                            ],
                                                                            {
                                                                                $multiply: [
                                                                                    SACObj?.igstRate,
                                                                                    "$otherCharges.totalAmount"
                                                                                ]
                                                                            }
                                                                        ]
                                                                    },
                                                                    0
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        }
                                    },
                                    100
                                ]
                            }
                        ]
                    }
                }
            }
        ];
        let rows = await PORepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        GSTAmount: {$sum: {$toDouble: "$GSTAmount"}},
                        netPOValue: {$sum: {$toDouble: "$netPOValue"}},
                        totalAmountWithTax: {$sum: {$toDouble: "$totalAmountWithTax"}}
                    }
                },
                {
                    $project: {
                        GSTAmount: {$round: ["$GSTAmount", 2]},
                        netPOValue: {$round: ["$netPOValue", 2]},
                        totalAmountWithTax: {$round: ["$totalAmountWithTax", 2]}
                    }
                }
            ]
        });
        return res.success({
            suppliers,
            ...rows
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllPPVReports = asyncHandler(async (req, res) => {
    try {
        const {supplier = null, fromDate = null, toDate = null, itemCategory = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            POStatus: {
                $nin: [
                    OPTIONS.defaultStatus.AWAITING_APPROVAL,
                    OPTIONS.defaultStatus.REJECTED,
                    OPTIONS.defaultStatus.CANCELLED
                ]
            },
            ...(!!supplier && {
                supplier: ObjectId(supplier)
            }),
            ...(!!toDate &&
                !!fromDate && {
                    PODate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = PurchaseOrderHelper.getAllPPVReportsAttributes();
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
            {$unwind: "$PODetails"},
            {$match: {$expr: {$ne: ["$PODetails.purchaseRate", "$PODetails.standardRate"]}}},
            {
                $lookup: {
                    from: "Items",
                    localField: "PODetails.item",
                    foreignField: "_id",
                    as: "PODetails.item"
                }
            },
            {$unwind: "$PODetails.item"},
            {
                $match: {
                    ...(!!itemCategory && {
                        "PODetails.item.itemType": itemCategory
                    })
                }
            },
            {
                $addFields: {
                    netPOValue: {$toString: "$netPOValue"},
                    PODateS: {$dateToString: {format: "%d-%m-%Y", date: "$PODate"}},
                    ppv: {
                        $round: [
                            {
                                $multiply: [
                                    "$PODetails.POQty",
                                    {
                                        $subtract: ["$PODetails.standardRate", "$PODetails.purchaseRate"]
                                    }
                                ]
                            },
                            2
                        ]
                    },
                    POQty: {$toString: "$PODetails.POQty"},
                    standardRate: {$toString: "$standardRate"},
                    purchaseRate: {$toString: "$purchaseRate"}
                }
            }
        ];
        const suppliers = await getAllSuppliers(req.user.company, {supplierName: 1});
        let rows = await PORepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        ppvValue: {$sum: {$toDouble: "$ppv"}}
                    }
                },
                {
                    $project: {
                        ppvValue: {$round: ["$ppvValue", 2]},
                        _id: 0
                    }
                }
            ]
        });
        return res.success({
            suppliers,
            itemCategoryOptions: ITEM_CATEGORY_OPTIONS,
            ...rows
        });
    } catch (e) {
        console.error("getAllPPVReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllPOSummaryReports = asyncHandler(async (req, res) => {
    try {
        const itemCategoryList = await getAllItemCategory(req.user.company);
        const suppliers = await getAllSuppliers(req.user.company, {supplierName: 1});
        const {supplier = null, fromDate = null, toDate = null, itemCategory = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            POStatus: {$nin: [OPTIONS.defaultStatus.AWAITING_APPROVAL, OPTIONS.defaultStatus.REJECTED]},
            ...(!!supplier && {
                supplier: {$eq: ObjectId(supplier)}
            }),
            ...(!!toDate &&
                !!fromDate && {
                    PODate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = PurchaseOrderHelper.getAllPOSummaryReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $addFields: {
                    PODateS: {$dateToString: {format: "%d-%m-%Y", date: "$PODate"}}
                }
            },
            {$unwind: "$PODetails"},
            {
                $lookup: {
                    from: "Items",
                    localField: "PODetails.item",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, itemType: 1}}],
                    as: "PODetails.item"
                }
            },
            {$unwind: "$PODetails.item"},
            {
                $match: {
                    ...(!!itemCategory && {
                        "PODetails.item.itemType": itemCategory
                    })
                }
            },
            {
                $group: {
                    _id: {
                        supplier: "$supplier",
                        type: "$PODetails.item.itemType"
                    },
                    totalOrders: {
                        $sum: 1
                    },
                    PODateMin: {$min: "$PODate"},
                    PODateMax: {$max: "$PODate"},
                    currency: {$first: "$currency"},
                    totalAmount: {
                        $sum: "$PODetails.lineValue"
                    },
                    avgOrderValue: {$avg: "$PODetails.lineValue"}
                }
            },
            {
                $project: {
                    supplier: "$_id.supplier",
                    itemCategory: "$_id.type",
                    PODateMin: 1,
                    PODateMax: 1,
                    currency: 1,
                    totalOrders: 1,
                    totalAmount: "$totalAmount",
                    avgOrderValue: 1
                }
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, supplierName: 1}}],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"}
        ];
        let rows = await PORepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        totalSumAmount: {$sum: {$toDouble: "$totalAmount"}}
                    }
                },
                {
                    $project: {
                        totalSumAmount: {$round: ["$totalSumAmount", 2]},
                        _id: 0
                    }
                }
            ]
        });
        return res.success({
            suppliers,
            itemsOptions: itemCategoryList.map(x => x.category),
            ...rows
        });
    } catch (e) {
        console.error("getAllPOSummaryReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllPOCostAnalysisReports = asyncHandler(async (req, res) => {
    const suppliers = await getAllSuppliers(req.user.company, {supplierName: 1});
    const items = await getAllItems(req.user.company, {itemName: 1});
    try {
        const {supplier = null, fromDate = null, toDate = null, item = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!supplier && {
                supplier: ObjectId(supplier)
            }),
            ...(!!toDate &&
                !!fromDate && {
                    PODate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = PurchaseOrderHelper.getAllPOCostAnalysisReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {$unwind: "$PODetails"},
            {
                $project: {
                    PODate: 1,
                    supplier: 1,
                    currency: 1,
                    item: "$PODetails.item",
                    POQty: "$PODetails.POQty",
                    standardRate: "$PODetails.standardRate",
                    purchaseRate: "$PODetails.purchaseRate",
                    lineValue: "$PODetails.lineValue"
                }
            },
            {
                $group: {
                    _id: {item: "$item", supplier: "$supplier"},
                    currency: {$first: "$currency"},
                    PODateMin: {$min: "$PODate"},
                    PODateMax: {$max: "$PODate"},
                    totalOrders: {$sum: 1},
                    totalTotalCost: {$sum: "$lineValue"},
                    averageCost: {$avg: "$lineValue"},
                    minCost: {$min: "$lineValue"},
                    maxCost: {$max: "$lineValue"}
                }
            },
            {
                $project: {
                    item: "$_id.item",
                    supplier: "$_id.supplier",
                    currency: 1,
                    PODateMin: 1,
                    PODateMax: 1,
                    totalOrders: 1,
                    totalTotalCost: "$totalTotalCost",
                    averageCost: 1,
                    minCost: 1,
                    maxCost: 1,
                    _id: 0
                }
            },
            {
                $match: {
                    ...(!!item && {
                        item: ObjectId(item)
                    })
                }
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, supplierName: 1}}],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"},
            {
                $lookup: {
                    from: "Items",
                    localField: "item",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, itemType: 1, itemName: 1, itemCode: 1, itemDescription: 1}}],
                    as: "item"
                }
            },
            {$unwind: "$item"}
        ];
        let rows = await PORepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        totalTotalCost: {$sum: {$toDouble: "$totalTotalCost"}}
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
            suppliers,
            items,
            ...rows
        });
    } catch (e) {
        console.error("getAllPOSummaryReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllPPVSummaryReports = asyncHandler(async (req, res) => {
    try {
        const itemCategoryList = await getAllItemCategory(req.user.company);
        const {supplier = null, fromDate = null, toDate = null, itemCategory = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!supplier && {
                supplier: ObjectId(supplier)
            }),
            ...(!!toDate &&
                !!fromDate && {
                    PODate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = {
            totalPPV: 1,
            PPVRatio: 1,
            itemCode: "$item.itemCode",
            itemDescription: "$item.itemDescription",
            itemType: "$_id"
        };
        let pipeline = [
            {$match: query},
            {$unwind: "$PODetails"},
            {$match: {$expr: {$ne: ["$PODetails.purchaseRate", "$PODetails.standardRate"]}}},
            {
                $lookup: {
                    from: "Items",
                    localField: "PODetails.item",
                    foreignField: "_id",
                    as: "PODetails.item"
                }
            },
            {$unwind: "$PODetails.item"},
            {
                $match: {
                    ...(!!itemCategory && {
                        "PODetails.item.itemType": itemCategory
                    })
                }
            },
            {
                $project: {
                    itemType: "$PODetails.item.itemType",
                    POQty: "$PODetails.POQty",
                    standardRate: "$PODetails.standardRate",
                    purchaseRate: "$PODetails.purchaseRate"
                }
            },
            {
                $group: {
                    _id: "$itemType",
                    totalPPV: {
                        $sum: {
                            $multiply: [
                                {
                                    $subtract: ["$standardRate", "$purchaseRate"]
                                },
                                "$POQty"
                            ]
                        }
                    },
                    totalPurchaseRate: {$sum: "$purchaseRate"},
                    totalStandardRate: {$sum: "$standardRate"}
                }
            },
            {
                $project: {
                    _id: 1,
                    totalPPV: 1,
                    PPVRatio: {
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
                    }
                }
            },
            {
                $addFields: {
                    totalPPV: {$round: ["$totalPPV", 2]},
                    PPVRatio: {$toString: {$round: ["$PPVRatio", 2]}}
                }
            }
        ];
        let rows = await PORepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        totalPPV: {$sum: {$toDouble: "$totalPPV"}}
                    }
                },
                {
                    $project: {
                        totalPPV: {$round: ["$totalPPV", 2]},
                        _id: 0
                    }
                }
            ]
        });
        const suppliers = await getAllSuppliers(req.user.company, {supplierName: 1});
        return res.success({
            suppliers,
            itemCategoryOptions: itemCategoryList.map(x => x.category),
            ...rows
        });
    } catch (e) {
        console.error("getAllPPVSummaryReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllPPVReportsBySupplier = asyncHandler(async (req, res) => {
    try {
        const itemCategoryList = await getAllItemCategory(req.user.company);
        const {supplier = null, fromDate = null, toDate = null, itemCategory = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            POStatus: {$nin: [OPTIONS.defaultStatus.AWAITING_APPROVAL, OPTIONS.defaultStatus.REJECTED]},
            ...(!!supplier && {
                supplier: ObjectId(supplier)
            }),
            ...(!!toDate &&
                !!fromDate && {
                    PODate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = PurchaseOrderHelper.getAllPPVReportsBySupplierAttributes();
        let pipeline = [
            {$match: query},
            {$unwind: "$PODetails"},
            {$match: {$expr: {$ne: ["$PODetails.purchaseRate", "$PODetails.standardRate"]}}},
            {
                $project: {
                    supplier: 1,
                    currency: 1,
                    item: "$PODetails.item",
                    POQty: "$PODetails.POQty",
                    standardRate: "$PODetails.standardRate",
                    purchaseRate: "$PODetails.purchaseRate",
                    lineValue: "$PODetails.lineValue",
                    linePPV: "$PODetails.linePPV"
                }
            },
            {
                $group: {
                    _id: {item: "$item", supplier: "$supplier"},
                    currency: {$first: "$currency"},
                    totalQuantityPurchased: {$sum: "$POQty"},
                    totalPurchaseAmount: {$sum: "$lineValue"},
                    totalPPV: {$sum: "$linePPV"}
                }
            },
            {
                $project: {
                    item: "$_id.item",
                    supplier: "$_id.supplier",
                    currency: 1,
                    totalQuantityPurchased: 1,
                    totalPurchaseAmount: {$round: ["$totalPurchaseAmount", 2]},
                    totalPPV: 1
                }
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, supplierName: 1}}],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"},
            {
                $lookup: {
                    from: "Items",
                    localField: "item",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, itemType: 1, itemCode: 1, itemDescription: 1}}],
                    as: "item"
                }
            },
            {$unwind: "$item"},
            {
                $match: {
                    ...(!!itemCategory && {
                        "item.itemType": itemCategory
                    })
                }
            },
            {
                $addFields: {
                    totalQuantityPurchased: {$toString: "$totalQuantityPurchased"},
                    totalPurchaseAmount: "$totalPurchaseAmount",
                    totalPPV: "$totalPPV"
                }
            }
        ];
        let rows = await PORepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        totalPPV: {$sum: {$toDouble: "$totalPPV"}}
                    }
                },
                {
                    $project: {
                        totalPPV: {$round: ["$totalPPV", 2]},
                        _id: 0
                    }
                }
            ]
        });
        const suppliers = await getAllSuppliers(req.user.company, {supplierName: 1});
        return res.success({
            suppliers,
            itemCategoryOptions: itemCategoryList.map(x => x.category),
            ...rows
        });
    } catch (e) {
        console.error("getAllPPVReportsBySupplier", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllPurchaseRateAnalysisByItem = asyncHandler(async (req, res) => {
    try {
        const {supplier = null, fromDate = null, toDate = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            POStatus: {$nin: [OPTIONS.defaultStatus.AWAITING_APPROVAL, OPTIONS.defaultStatus.REJECTED]},
            ...(!!supplier && {
                supplier: ObjectId(supplier)
            }),
            ...(!!toDate &&
                !!fromDate && {
                    PODate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = PurchaseOrderHelper.getAllPurchaseRateAnalysisByItemAttributes();
        let pipeline = [
            {$match: query},
            {$unwind: "$PODetails"},
            {
                $project: {
                    PODate: 1,
                    supplier: 1,
                    item: "$PODetails.item",
                    standardRate: "$PODetails.standardRate",
                    purchaseRate: "$PODetails.purchaseRate"
                }
            },
            {
                $group: {
                    _id: {item: "$item", supplier: "$supplier"},
                    standardRate: {$first: "$standardRate"},
                    PORateMin: {$min: "$purchaseRate"},
                    PORateMax: {$max: "$purchaseRate"},
                    avgRate: {$avg: "$purchaseRate"},
                    lastPurchaseRate: {$last: "$purchaseRate"}
                }
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "_id.supplier",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 0, supplierName: 1}}],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"},
            {
                $lookup: {
                    from: "Items",
                    localField: "_id.item",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 0, itemName: 1, itemCode: 1, itemDescription: 1}}],
                    as: "item"
                }
            },
            {$unwind: "$item"}
        ];
        const suppliers = await getAllSuppliers(req.user.company, {supplierName: 1});
        let rows = await PORepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            suppliers,
            ...rows
        });
    } catch (e) {
        console.error("getAllPurchaseRateAnalysisByItem", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllPPVDetailsReports = asyncHandler(async (req, res) => {
    try {
        const {supplier = null, fromDate = null, toDate = null, itemCategory = null} = req.query;
        let project = PurchaseOrderHelper.getAllPPVDetailsReportsAttributes();
        let query = {
            company: ObjectId(req.user.company),
            POStatus: {$nin: [OPTIONS.defaultStatus.AWAITING_APPROVAL, OPTIONS.defaultStatus.REJECTED]},
            ...(!!supplier && {
                supplier: {$eq: ObjectId(supplier)}
            }),
            ...(!!toDate &&
                !!fromDate && {
                    PODate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let pipeline = [
            {$match: query},
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
            {$unwind: "$PODetails"},
            {$match: {$expr: {$ne: ["$PODetails.purchaseRate", "$PODetails.standardRate"]}}},
            {
                $lookup: {
                    from: "Items",
                    localField: "PODetails.item",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, itemType: 1, itemCode: 1, itemDescription: 1}}],
                    as: "PODetails.item"
                }
            },
            {$unwind: "$PODetails.item"},
            {
                $match: {
                    ...(!!itemCategory && {
                        "PODetails.item.itemType": itemCategory
                    })
                }
            },
            {
                $addFields: {
                    netPOValue: {$toString: "$netPOValue"},
                    PODateS: {$dateToString: {format: "%d-%m-%Y", date: "$PODate"}},
                    POQty: {$toString: "$PODetails.POQty"},
                    standardPrice: {$toString: "$standardPrice"},
                    actualPrice: {$toString: "$actualPrice"},
                    variance: {$toString: "$variance"},
                    variancePercentage: {$toString: "$variancePercentage"}
                }
            }
        ];
        const itemCategoryList = await getAllItemCategory(req.user.company);
        const suppliers = await getAllSuppliers(req.user.company, {supplierName: 1});
        let rows = await PORepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            suppliers,
            itemCategoryOptions: itemCategoryList.map(x => x.category),
            ...rows
        });
    } catch (e) {
        console.error("getAllPPVDetailsReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllPurchaseAmountReports = async company => {
    try {
        const monthsArray = getFiscalMonthsName();
        const purchaseAmount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const result = await Model.aggregate([
            {
                $match: {
                    company: ObjectId(company),
                    POStatus: {$nin: [OPTIONS.defaultStatus.AWAITING_APPROVAL, OPTIONS.defaultStatus.REJECTED]},
                    PODate: {
                        $gte: getFirstDateOfCurrentFiscalYear(),
                        $lte: getLastDateOfCurrentFiscalYear()
                    }
                }
            },
            {
                $group: {
                    _id: {year_month: {$substrCP: ["$PODate", 0, 7]}},
                    totalAmount: {$sum: "$netPOValue"}
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
                purchaseAmount[index] = (propertyValues[n] / LAKH).toFixed(2);
                n++;
            });
            purchaseAmount;
        } else {
            purchaseAmount;
        }
        return purchaseAmount;
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};
exports.getAllOutstandingPOReports = asyncHandler(async (req, res) => {
    try {
        let supplierList = await getAllSuppliers(req.user.company, {supplierName: 1});
        const {fromDate = null, toDate = null, supplier = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            POStatus: {$in: OPTIONS.defaultStatus.getAllOutstandingPOReportsStatus()},
            ...(!!toDate &&
                !!fromDate && {
                    PODate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                }),
            ...(!!supplier && {
                supplier: ObjectId(supplier)
            })
        };
        let project = PurchaseOrderHelper.getAllOutstandingPOReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $addFields: {
                    PODateS: {$dateToString: {format: "%d-%m-%Y", date: "$PODate"}}
                }
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, supplierName: 1}}],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"},
            {$unwind: "$PODetails"},
            {
                $lookup: {
                    from: "Items",
                    localField: "PODetails.item",
                    foreignField: "_id",
                    as: "PODetails.item"
                }
            },
            {$unwind: "$PODetails.item"},
            {
                $match: {
                    "PODetails.balancedQty": {$gt: 0}
                }
            },
            {
                $addFields: {
                    POQty: {$toString: "$PODetails.POQty"},
                    balancedQty: {$toString: "$PODetails.balancedQty"}
                }
            }
        ];
        let rows = await PORepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            supplierList,
            ...rows
        });
    } catch (e) {
        console.error("getAllOutstandingPOReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getTotalNoOfOutstandingPOPerDay = async company => {
    try {
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
                    POStatus: {$in: OPTIONS.defaultStatus.getAllOutstandingPOReportsStatus()},
                    matchDate: currentDate
                }
            },
            {
                $group: {
                    _id: null,
                    count: {$sum: 1}
                }
            },
            {
                $project: {
                    _id: 0,
                    count: 1
                }
            }
        ]);
        return {outstandingPOCount: rows[0]?.count || 0};
    } catch (error) {
        console.error("error", error);
    }
};
exports.getAllItemConsumptionReports = asyncHandler(async (req, res) => {
    try {
        const {year = 0} = req.query;
        const startDate = new Date(
            getFirstDateOfCurrentFiscalYear().setFullYear(getFirstDateOfCurrentFiscalYear().getFullYear() - year)
        );
        const endDate = new Date(
            getLastDateOfCurrentFiscalYear().setFullYear(getLastDateOfCurrentFiscalYear().getFullYear() - year)
        );
        let query = {
            company: ObjectId(req.user.company),
            POStatus: OPTIONS.defaultStatus.CLOSED,
            PODate: {
                $lte: getEndDateTime(endDate),
                $gte: getStartDateTime(startDate)
            }
        };
        let project = PurchaseOrderHelper.getAllItemConsumptionReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $unwind: "$PODetails"
            },
            {
                $project: {
                    "PODetails.item": 1,
                    PODate: 1,
                    "PODetails.POQty": 1,
                    "PODetails.purchaseRate": 1,
                    "PODetails.UOM": 1,
                    month: {$month: "$PODate"}
                }
            },
            {
                $group: {
                    _id: {item: "$PODetails.item", UOM: "$PODetails.UOM"},
                    jan: {$sum: {$cond: [{$eq: [1, "$month"]}, "$PODetails.POQty", 0]}},
                    feb: {$sum: {$cond: [{$eq: [2, "$month"]}, "$PODetails.POQty", 0]}},
                    mar: {$sum: {$cond: [{$eq: [3, "$month"]}, "$PODetails.POQty", 0]}},
                    apr: {$sum: {$cond: [{$eq: [4, "$month"]}, "$PODetails.POQty", 0]}},
                    may: {$sum: {$cond: [{$eq: [5, "$month"]}, "$PODetails.POQty", 0]}},
                    jun: {$sum: {$cond: [{$eq: [6, "$month"]}, "$PODetails.POQty", 0]}},
                    jul: {$sum: {$cond: [{$eq: [7, "$month"]}, "$PODetails.POQty", 0]}},
                    aug: {$sum: {$cond: [{$eq: [8, "$month"]}, "$PODetails.POQty", 0]}},
                    sep: {$sum: {$cond: [{$eq: [9, "$month"]}, "$PODetails.POQty", 0]}},
                    oct: {$sum: {$cond: [{$eq: [10, "$month"]}, "$PODetails.POQty", 0]}},
                    nov: {$sum: {$cond: [{$eq: [11, "$month"]}, "$PODetails.POQty", 0]}},
                    dec: {$sum: {$cond: [{$eq: [12, "$month"]}, "$PODetails.POQty", 0]}},
                    total: {$sum: "$PODetails.POQty"},
                    netRate: {$last: "$PODetails.purchaseRate"}
                }
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "_id.item",
                    foreignField: "_id",
                    pipeline: [{$project: {itemCode: 1, itemName: 1, itemDescription: 1}}],
                    as: "item"
                }
            },
            {$unwind: "$item"}
        ];
        let rows = await PORepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            ...rows
        });
    } catch (e) {
        console.error("getAllItemConsumptionReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
