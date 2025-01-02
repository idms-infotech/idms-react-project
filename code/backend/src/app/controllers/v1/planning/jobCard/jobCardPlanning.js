const asyncHandler = require("express-async-handler");
const {getAllSOForJCAttributes} = require("../../../../models/planning/helpers/jobCardHelper");
const SORepository = require("../../../../models/sales/repository/salesOrderRepository");
const {ObjectId} = require("../../../../../config/mongoose");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {JOB_CARD_CREATION} = require("../../../../mocks/schemasConstant/planningConstant");
const {JOB_ORDER_TYPE} = require("../../../../mocks/constantData");
const SKUMasterRepository = require("../../../../models/sales/repository/SKUMasterRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
exports.getAllSOForJC = asyncHandler(async (req, res) => {
    try {
        let project = getAllSOForJCAttributes();
        let query = {
            company: ObjectId(req.user.company),
            // "SODetails.JCCQty": {$gt: 0},
            SOStatus: {$nin: ["Created", "Cancelled"]}
        };
        let pipeline = [
            {$unwind: "$SODetails"},
            {$match: query},
            {
                $lookup: {
                    from: "JobCardCreation",
                    let: {
                        soId: "$_id",
                        customerId: "$customer",
                        skuId: "$SODetails.SKU"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{$eq: ["$reference", "$$customerId"]}]
                                }
                            }
                        },
                        {
                            $addFields: {
                                inProcessQty: {
                                    $reduce: {
                                        input: "$SKUDetails",
                                        initialValue: 0,
                                        in: {$sum: ["$$value", "$$this.batchQty"]}
                                    }
                                }
                            }
                        },
                        {$unwind: "$SKUDetails"},
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {$eq: ["$SKUDetails.SKU", "$$skuId"]},
                                        {$eq: ["$SKUDetails.reference", "$$soId"]}
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                jobCardNo: 1,
                                status: 1,
                                customerName: "$customerName",
                                SKUNo: "$SKUDetails.SKUNo",
                                SO_FCNumber: "$SKUDetails.SO_FCNumber",
                                inProcessQty: 1
                            }
                        }
                    ],
                    as: "jobCardCreation"
                }
            },
            {
                $unwind: {
                    path: "$jobCardCreation",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    $or: [
                        {
                            $expr: {$gt: ["$SODetails.JCCQty", 0]}
                        },
                        {
                            $expr: {$eq: ["$SODetails.JCCQty", 0]},
                            "jobCardCreation._id": {$exists: true},
                            "jobCardCreation.status": {
                                $nin: [OPTIONS.defaultStatus.CLOSED, OPTIONS.defaultStatus.CANCELLED]
                            }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        SOId: "$_id",
                        customer: "$customer",
                        SKU: "$SODetails.SKU",
                        jobCard: "$jobCardCreation._id"
                    },
                    UOM: {$first: "$SODetails.UOM"},
                    SONumber: {$first: "$SONumber"},
                    SODate: {$first: "$SODate"},
                    balanceQty: {$sum: "$SODetails.JCCQty"},
                    jobCardCreation: {$first: "$jobCardCreation"}
                }
            },
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "_id.SKU",
                    foreignField: "_id",
                    pipeline: [{$project: {SKUName: 1, SKUNo: 1, SKUDescription: 1, drawing: "$artWorkHyperLink"}}],
                    as: "SKU"
                }
            },
            {$unwind: "$SKU"},
            {
                $lookup: {
                    from: "Customer",
                    localField: "_id.customer",
                    foreignField: "_id",
                    pipeline: [{$project: {customerName: 1, customerNickName: 1}}],
                    as: "customer"
                }
            },
            {$unwind: "$customer"},
            {
                $lookup: {
                    from: "FGIN",
                    localField: "_id.SKU",
                    foreignField: "SKUId",
                    pipeline: [
                        {$project: {FGINQuantity: 1}},
                        {
                            $group: {
                                _id: null,
                                FGINQuantity: {$sum: "$FGINQuantity"}
                            }
                        }
                    ],
                    as: "FGIN"
                }
            },
            {
                $unwind: {
                    path: "$FGIN",
                    preserveNullAndEmptyArrays: true
                }
            }
        ];
        // let FCPipeline = [
        //     {$unwind: "$salesForecastDetails"},
        //     {
        //         $match: {
        //             company: ObjectId(req.user.company),
        //             "SODetails.JCCQty": {$gt: 0},
        //             status: {$nin: ["Created", "Cancelled"]}
        //         }
        //     },
        //     {
        //         $lookup: {
        //             from: "JobCardCreation",
        //             let: {soId: "$_id", customerId: "$customer", skuId: "$salesForecastDetails.SKU"},
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [{$eq: ["$reference", "$$customerId"]}]
        //                         }
        //                     }
        //                 },
        //                 {
        //                     $addFields: {
        //                         inProcessQty: {
        //                             $reduce: {
        //                                 input: "$SKUDetails",
        //                                 initialValue: 0,
        //                                 in: {$sum: ["$$value", "$$this.batchQty"]}
        //                             }
        //                         }
        //                     }
        //                 },
        //                 {$unwind: "$SKUDetails"},
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $and: [
        //                                 {$eq: ["$SKUDetails.SKU", "$$skuId"]},
        //                                 {$eq: ["$SKUDetails.reference", "$$soId"]}
        //                             ]
        //                         }
        //                     }
        //                 },
        //                 {
        //                     $project: {
        //                         _id: 1,
        //                         jobCardNo: 1,
        //                         status: 1,
        //                         customerName: "$customerName",
        //                         SKUNo: "$SKUDetails.SKUNo",
        //                         SO_FCNumber: "$SKUDetails.SO_FCNumber",
        //                         inProcessQty: 1
        //                     }
        //                 }
        //             ],
        //             as: "jobCardCreation"
        //         }
        //     },
        //     {
        //         $unwind: {
        //             path: "$jobCardCreation",
        //             preserveNullAndEmptyArrays: true
        //         }
        //     },
        //     {
        //         $lookup: {
        //             from: "SKUMaster",
        //             localField: "salesForecastDetails.SKU",
        //             foreignField: "_id",
        //             pipeline: [{$project: {SKUName: 1, SKUNo: 1, SKUDescription: 1, drawing: "$artWorkHyperLink"}}],
        //             as: "salesForecastDetails.SKU"
        //         }
        //     },
        //     {$unwind: "$salesForecastDetails.SKU"},
        //     {
        //         $lookup: {
        //             from: "Customer",
        //             localField: "customer",
        //             foreignField: "_id",
        //             pipeline: [{$project: {customerName: 1, customerNickName: 1}}],
        //             as: "customer"
        //         }
        //     },
        //     {$unwind: "$customer"},
        //     {
        //         $lookup: {
        //             from: "FGIN",
        //             localField: "salesForecastDetails.SKU._id",
        //             foreignField: "SKUId",
        //             pipeline: [
        //                 {$project: {FGINQuantity: 1}},
        //                 {
        //                     $group: {
        //                         _id: null,
        //                         FGINQuantity: {$sum: "$FGINQuantity"}
        //                     }
        //                 }
        //             ],
        //             as: "FGIN"
        //         }
        //     },
        //     {
        //         $unwind: {
        //             path: "$FGIN",
        //             preserveNullAndEmptyArrays: true
        //         }
        //     }
        // ];
        let rows = await SORepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        balanceQty: {$sum: "$balanceQty"},
                        FGINQty: {$sum: "$FGINQty"},
                        inProcessQty: {$sum: "$inProcessQty"}
                    }
                },
                {
                    $project: {
                        _id: 0,
                        balanceQty: 1,
                        FGINQty: 1,
                        inProcessQty: 1
                    }
                }
            ]
        });
        return res.success({
            ...rows
        });
    } catch (e) {
        console.error("getAllSOForJC", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllJCTableList = asyncHandler(async (req, res) => {
    try {
        const {customerId = null, SKUId = null, SOId = null, creationFlag = null} = req.query;
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            JOB_CARD_CREATION.AUTO_INCREMENT_DATA(),
            req.user.company
        );
        let pipeline = [
            {$unwind: "$SODetails"},
            {
                $match: {
                    ...(creationFlag == "Smart Planning" && {customer: ObjectId(customerId)}),
                    "SODetails.SKU": ObjectId(SKUId),
                    ...(creationFlag == "Create JC" && {_id: ObjectId(SOId)}),
                    "SODetails.JCCQty": {$gt: 0}
                }
            },
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "SODetails.SKU",
                    foreignField: "_id",
                    pipeline: [{$project: {SKUName: 1, SKUNo: 1, SKUDescription: 1}}],
                    as: "SODetails.SKU"
                }
            },
            {$unwind: "$SODetails.SKU"},
            {
                $lookup: {
                    from: "FGIN",
                    localField: "SODetails.SKU",
                    foreignField: "SKUId",
                    pipeline: [
                        {
                            $match: {
                                FGINQuantity: {$gt: 0},
                                $or: [{expiryDate: {$gt: new Date()}}, {expiryDate: null}]
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                batchNo: 1,
                                batchDate: "$manufacturingDate",
                                UOM: 1,
                                FGQty: "$FGINQuantity",
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
                        }
                    ],
                    as: "inventory"
                }
            },
            {
                $lookup: {
                    from: "MapCategoryHSN",
                    localField: "salesCategory",
                    foreignField: "productCategory",
                    pipeline: [{$project: {_id: 0, colourName: 1}}],
                    as: "mapCategory"
                }
            },
            {$unwind: {path: "$mapCategory", preserveNullAndEmptyArrays: true}},
            {
                $project: {
                    _id: 0,
                    lineNumber: "$SODetails.SOLineNumber",
                    reference: "$_id",
                    referenceModel: "SalesOrder",
                    SO_FCNumber: "$SONumber",
                    SO_FCDate: "$SODate",
                    code: {$ifNull: ["$mapCategory.colourName", "#007daf"]},
                    SKU: "$SODetails.SKU._id",
                    SKUNo: "$SODetails.SKU.SKUNo",
                    SKUName: "$SODetails.SKU.SKUName",
                    SKUDescription: "$SODetails.SKU.SKUDescription",
                    UOM: "$SODetails.UOM",
                    balQty: {$ifNull: ["$SODetails.JCCQty", 0]},
                    totalFGQty: {
                        $reduce: {
                            input: "$inventory",
                            initialValue: 0,
                            in: {$add: ["$$value", "$$this.FGQty"]}
                        }
                    },
                    batchQty: {$literal: 0},
                    FGInventoryInfo: "$inventory",
                    dispatchSchedule: {
                        $cond: {
                            if: {
                                $and: [
                                    {$ne: [{$type: "$SODetails.dispatchSchedule"}, "missing"]},
                                    {$gt: [{$size: {$ifNull: ["$SODetails.dispatchSchedule", []]}}, 0]}
                                ]
                            },
                            then: "$SODetails.dispatchSchedule",
                            else: [
                                {
                                    scheduleNo: 1,
                                    quantity: "$SODetails.orderedQty",
                                    dispatchDate: {$ifNull: ["$SODetails.dispatchDate", "$SODetails.SOLineTargetDate"]},
                                    PPICDate: "$SODetails.SOLineTargetDate"
                                }
                            ]
                        }
                    },
                    SO_FCLineTargetDate: "$SODetails.SOLineTargetDate"
                }
            }
        ];
        let rows = await SORepository.filteredSalesOrderList(pipeline);
        let SKUData = await SKUMasterRepository.getDocById(SKUId, {_id: 0, SKUStage: 1});
        let masterDataPipeline = [
            {
                $match: {
                    ...(creationFlag == "Smart Planning" && {customer: ObjectId(customerId)}),
                    "SODetails.SKU": ObjectId(SKUId),
                    ...(creationFlag == "Create JC" && {_id: ObjectId(SOId)}),
                    "SODetails.JCCQty": {$gt: 0}
                }
            },
            {
                $lookup: {
                    from: "JobCardCreation",
                    let: {soId: "$_id", customerId: "$customer", skuId: "$SODetails.SKU"},
                    pipeline: [
                        {$unwind: "$SKUDetails"},
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {$eq: ["$SKUDetails.SKU", "$$skuId"]},
                                        {
                                            $cond: [
                                                creationFlag == "Create JC",
                                                {$eq: ["$SKUDetails.reference", "$$soId"]},
                                                true
                                            ]
                                        },
                                        {
                                            $cond: [
                                                creationFlag == "Smart Planning",
                                                {$eq: ["$reference", "$$customerId"]},
                                                true
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                jobCardNo: 1,
                                jobCardDate: 1,
                                batchInfo: 1
                            }
                        }
                    ],
                    as: "jobCardCreation"
                }
            },
            {
                $unwind: {
                    path: "$jobCardCreation",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                customerName: 1,
                                customerCategory: 1,
                                currency: "$customerCurrency",
                                reference: "$_id",
                                referenceModel: "Customer"
                            }
                        }
                    ],
                    as: "customer"
                }
            },
            {$unwind: "$customer"},

            {
                $project: {
                    customerName: "$customer.customerName",
                    customerCategory: "$customer.customerCategory",
                    currency: "$customer.currency",
                    reference: "$customer.reference",
                    referenceModel: "$customer.referenceModel",
                    orderType: JOB_ORDER_TYPE.ALL,
                    stage: SKUData.SKUStage,
                    jobCard: "$jobCardCreation._id",
                    jobCardNo: "$jobCardCreation.jobCardNo",
                    jobCardDate: "$jobCardCreation.jobCardDate",
                    batchInfo: "$jobCardCreation.batchInfo"
                }
            }
        ];
        let masterData = await SORepository.filteredSalesOrderList(masterDataPipeline);

        return res.success({rows, autoIncrementNo, masterData: masterData.length > 0 ? masterData[0] : {}});
    } catch (e) {
        console.error("getAllSOForJC", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
