const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllGoodsTransferRequestAttributes
} = require("../../../../models/planning/helpers/goodsTransferRequestHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {GOODS_TRANSFER_REQUEST} = require("../../../../mocks/schemasConstant/planningConstant");
const GoodsTransferRequestRepository = require("../../../../models/planning/repository/goodsTransferRequestRepository");
const {getCompanyLocations} = require("../../settings/company/company");
const {getAllInventoryCorrectionByItems} = require("../../stores/Inventory/Inventory");
const {OPTIONS} = require("../../../../helpers/global.options");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const InventoryRepository = require("../../../../models/stores/repository/inventoryCorrectionRepository");
const {
    filteredInventoryDepartmentsList
} = require("../../../../models/settings/repository/inventoryDepartmentsRepository");
const {
    filteredProductionUnitConfigList
} = require("../../../../models/planning/repository/productionUnitConfigRepository");
const {GOODS_TRANSFER_REQUEST_DEPT} = require("../../../../mocks/constantData");
const {filteredJobCardList} = require("../../../../models/planning/repository/jobCardRepository");
const {filteredBoMOfSKUList} = require("../../../../models/planning/repository/BOMRepository/BoMOfSKURepository");
const BOMOfSKURepository = require("../../../../models/planning/repository/BOMRepository/BoMOfSKURepository");
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllGoodsTransferRequestAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company), status: OPTIONS.defaultStatus.AWAITING_APPROVAL}}
        ];
        let rows = await GoodsTransferRequestRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.create = asyncHandler(async (req, res) => {
    try {
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        let inventoryRecords = await getAllInventoryCorrectionByItems(req.user.company, createdObj.GTRequestDetails);
        let codes = createdObj.GTRequestDetails.filter(x => {
            if (inventoryRecords?.length) {
                return !inventoryRecords.map(y => y?.item?._id).some(ele => String(ele) == String(x?.item));
            } else {
                return true;
            }
        });
        let itemCodes = codes.map(x => x.itemCode);
        const itemDetails = await GoodsTransferRequestRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Goods Transfer Request"),
                itemCodes
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Goods Transfer Request", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await GoodsTransferRequestRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        if (req.body.status == OPTIONS.defaultStatus.APPROVED) {
            req.body.GTRequestDetails = req.body.GTRequestDetails.map(ele => {
                ele.balancedQty = ele.GTRequestQty;
                ele.GTQty = 0;
                return ele;
            });
        }
        itemDetails = await GoodsTransferRequestRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Goods Transfer Request has been")
        });
    } catch (e) {
        console.error("update Goods Transfer Request", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await GoodsTransferRequestRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Goods Transfer Request")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Goods Transfer Request");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Goods Transfer Request", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await GoodsTransferRequestRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Goods Transfer Request");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Goods Transfer Request", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            GOODS_TRANSFER_REQUEST.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
        const locationOptions = await getCompanyLocations(req.user.company);
        const departmentOptions = await filteredInventoryDepartmentsList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $project: {
                    _id: 0,
                    department: "$departmentType",
                    label: "$departmentName",
                    value: "$departmentName"
                }
            }
        ]);
        const JCOptions = await filteredJobCardList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: {$in: [OPTIONS.defaultStatus.REPORT_GENERATED]}
                }
            },
            // {
            //     $lookup: {
            //         from: "JobCardEntry",
            //         localField: "_id",
            //         foreignField: "jobCard",
            //         pipeline: [
            //             {
            //                 $match: {
            //                     "generateReport.checkoutStatus": {
            //                         $in: [
            //                             OPTIONS.defaultStatus.MARK_AS_COMPLETED,
            //                             OPTIONS.defaultStatus.SKIP_INTEGRATION
            //                         ]
            //                     }
            //                 }
            //             }
            //         ],
            //         as: "jobCardEntry"
            //     }
            // },
            // {
            //     $match: {
            //         jobCardEntry: {$size: 0}
            //     }
            // },
            {
                $addFields: {
                    JCDetails: {
                        $map: {
                            input: "$SKUDetails",
                            as: "details",
                            in: {
                                SKU: "$$details.SKU",
                                SKUNo: "$$details.SKUNo",
                                SKUName: "$$details.SKUName",
                                SKUDescription: "$$details.SKUDescription",
                                UOM: "$$details.UOM",
                                batchInfo: "$$details.batchInfo",
                                referenceModel: "SKUMaster"
                            }
                        }
                    }
                }
            },
            {
                $unwind: {
                    path: "$JCDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: {jobCard: "$_id", SKU: "$JCDetails.SKU"},
                    jobCardNo: {$first: "$jobCardNo"},
                    SKUNo: {$first: "$JCDetails.SKUNo"},
                    SKUName: {$first: "$JCDetails.SKUName"},
                    SKUDescription: {$first: "$JCDetails.SKUDescription"},
                    UOM: {$first: "$JCDetails.UOM"},
                    batchQty: {$first: "$batchInfo.totalBatchQuantity"},
                    orderType: {$first: "$orderType"}
                }
            },
            {
                $project: {
                    _id: "$_id.jobCard",
                    jobCardNo: 1,
                    SKU: "$_id.SKU",
                    SKUNo: 1,
                    SKUName: 1,
                    SKUDescription: 1,
                    UOM: 1,
                    batchQty: 1
                }
            },
            // {
            //     $lookup: {
            //         from: "BoMOfSKU",
            //         localField: "SKU",
            //         foreignField: "SKU",
            //         pipeline: [
            //             {
            //                 $project: {
            //                     _id: 0,
            //                     BOMOfSKUDetails: 1
            //                 }
            //             },
            //             {
            //                 $unwind: {
            //                     path: "$BOMOfSKUDetails",
            //                     preserveNullAndEmptyArrays: false
            //                 }
            //             },
            //             {
            //                 $group: {
            //                     _id: "$SKU",
            //                     itemIds: {$addToSet: "$BOMOfSKUDetails.reference"}
            //                 }
            //             }
            //         ],
            //         as: "BOMOfSKUInfo"
            //     }
            // },
            // {
            //     $unwind: {
            //         path: "$BOMOfSKUInfo",
            //         preserveNullAndEmptyArrays: false
            //     }
            // },
            // {
            //     $addFields: {
            //         itemIds: "$BOMOfSKUInfo.itemIds"
            //     }
            // },
            // {
            //     $project: {
            //         BOMOfSKUInfo: 0
            //     }
            // },
            {
                $sort: {jobCardNo: -1}
            }
        ]);
        const productionUnitOptions = await filteredProductionUnitConfigList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $sort: {srNo: 1}
            },
            {
                $project: {
                    _id: 0,
                    department: GOODS_TRANSFER_REQUEST_DEPT.PRODUCTION,
                    label: {$concat: ["$prodUnitName", " ", "(", "$prodUnitCode", ")"]},
                    value: {$concat: ["$prodUnitName", " ", "(", "$prodUnitCode", ")"]}
                }
            }
        ]);
        return res.success({
            autoIncrementNo,
            JCOptions,
            locationOptions: locationOptions?.split(",")?.map(x => {
                return {
                    label: x,
                    value: x
                };
            }),
            departmentOptions: [...departmentOptions, ...productionUnitOptions]
        });
    } catch (error) {
        console.error("getAllMasterData Goods Transfer Request", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllItemsByLocationAndDept = asyncHandler(async (req, res) => {
    try {
        const {department = null, location = null} = req.query;
        const itemsList = await InventoryRepository.filteredInventoryCorrectionList([
            {
                $match: {
                    $expr: {
                        $or: [
                            {
                                $and: [
                                    {$eq: ["$referenceModel", "ProductionItem"]},
                                    {$eq: ["$departmentName", department]}
                                ]
                            },
                            {
                                $and: [
                                    {$ne: ["$referenceModel", "ProductionItem"]},
                                    {
                                        $or: [
                                            {$eq: ["$department", department]},
                                            {$eq: ["$departmentName", department]}
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    deliveryLocation: location
                    // $or: [{department: department}, {departmentName: department}],
                    // closedIRQty: {$gt: 0}
                }
            },
            {
                $addFields: {
                    convertedClosedIRQty: {
                        $cond: [
                            {$eq: ["$UOM", "$primaryUnit"]},
                            {
                                $cond: [
                                    {
                                        $not: ["$primaryToSecondaryConversion"]
                                    },
                                    {
                                        $cond: [
                                            {
                                                $or: [
                                                    {$not: ["$secondaryToPrimaryConversion"]},
                                                    {$eq: ["$secondaryUnit", "-"]}
                                                ]
                                            },
                                            "$closedIRQty",
                                            {
                                                $divide: ["$closedIRQty", "$secondaryToPrimaryConversion"]
                                            }
                                        ]
                                    },
                                    {
                                        $multiply: ["$closedIRQty", "$primaryToSecondaryConversion"]
                                    }
                                ]
                            },
                            "$closedIRQty"
                        ]
                    },
                    UOM: {
                        $cond: [
                            {$or: [{$eq: ["$secondaryUnit", "-"]}, {$not: ["$secondaryUnit"]}]},
                            "$UOM",
                            "$secondaryUnit"
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: {itemId: "$item", UOM: "$UOM", width: "$width", length: "$length"},
                    closedIRQty: {$sum: "$convertedClosedIRQty"},
                    primaryToSecondaryConversion: {$first: "$primaryToSecondaryConversion"},
                    secondaryToPrimaryConversion: {$first: "$secondaryToPrimaryConversion"},
                    primaryUnit: {$first: "$primaryUnit"},
                    secondaryUnit: {$first: "$secondaryUnit"},
                    conversionOfUnits: {$first: "$conversionOfUnits"},
                    itemCode: {$first: "$itemCode"},
                    itemName: {$first: "$itemName"},
                    itemDescription: {$first: "$itemDescription"},
                    conversionOfUnits: {$first: "$conversionOfUnits"},
                    referenceModel: {$first: "$referenceModel"}
                }
            },
            {
                $project: {
                    _id: 0,
                    GTRequestLineNumber: {$literal: 0},
                    item: "$_id.itemId",
                    refItems: "$referenceModel",
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    UOM: "$_id.UOM",
                    primaryToSecondaryConversion: 1,
                    secondaryToPrimaryConversion: 1,
                    primaryUnit: 1,
                    secondaryUnit: 1,
                    conversionOfUnits: 1,
                    IRQty: {$round: ["$closedIRQty", 4]},
                    GTRequestQty: {$literal: 0},
                    GTQty: {$literal: 0},
                    balancedQty: {$literal: 0},
                    previousGTRequestQty: {$literal: 0}
                }
            },
            {
                $sort: {itemCode: 1}
            }
        ]);
        return res.success(itemsList);
    } catch (error) {
        console.error("getAllItemsByLocationAndDept Goods Transfer Request", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.updateGTRQtyOnGTResponse = async (updatedBy, GTRId, GTRLineNumber, updateItemId, responseQty, action) => {
    try {
        const GTReqData = await GoodsTransferRequestRepository.getDocById(GTRId);
        if (GTReqData) {
            const newGTRDetails = GTReqData.GTRequestDetails.map(ele => {
                if (ele.GTRequestLineNumber === GTRLineNumber && ele.item.toString() === updateItemId.toString()) {
                    if (action == "create") {
                        ele.balancedQty = ele.balancedQty - responseQty;
                        ele.previousGTRequestQty = responseQty;
                    } else if (action == "update") {
                        ele.balancedQty = ele.balancedQty + ele.previousGTRequestQty - responseQty;
                        ele.previousGTRequestQty = responseQty;
                    }
                }
                return ele;
            });
            GTReqData.updatedBy = updatedBy;
            GTReqData.GTRequestDetails = newGTRDetails;
            const updatedGoodsRequisition = await GTReqData.save();
            return updatedGoodsRequisition;
        }
    } catch (error) {
        console.error("updatedGoodsRequisition::::: Error in updating Goods Requisition ======= ", error);
    }
};
exports.updateGTRQtyOnGTResponseRejected = async (updatedBy, GTRId, GTRLineNumber, updateItemId, responseQty) => {
    try {
        const GTReqData = await GoodsTransferRequestRepository.getDocById(GTRId);
        if (GTReqData) {
            const newGTRDetails = GTReqData.GTRequestDetails.map(ele => {
                if (ele.GTRequestLineNumber === GTRLineNumber && ele.item.toString() === updateItemId.toString()) {
                    ele.balancedQty = ele.balancedQty + responseQty;
                    ele.previousGTRequestQty = 0;
                }
                return ele;
            });
            GTReqData.updatedBy = updatedBy;
            GTReqData.GTRequestDetails = newGTRDetails;
            const updatedGoodsRequisition = await GTReqData.save();
            return updatedGoodsRequisition;
        }
    } catch (error) {
        console.error("updatedGoodsRequisition::::: Error in updating Goods Requisition ======= ", error);
    }
};
exports.getAllGtRequestFulfillmentReports = asyncHandler(async (req, res) => {
    try {
        const {fromDate = null, toDate = null, status = null} = req.query;
        let project = {
            GTRequestNo: 1,
            fromDepartment: 1,
            toDepartment: 1,
            GTRequestDate: {$dateToString: {format: "%d-%m-%Y", date: "$GTRequestDate"}},
            itemCode: "$GTRequestDetails.itemCode",
            itemName: "$GTRequestDetails.itemName",
            itemDescription: "$GTRequestDetails.itemDescription",
            UOM: "$GTRequestDetails.UOM",
            GTRequestQty: "$GTRequestDetails.GTRequestQty",
            GTQty: {
                $round: [{$abs: {$subtract: ["$GTRequestDetails.GTRequestQty", "$GTRequestDetails.balancedQty"]}}, 2]
            },
            GTStatus: 1,
            createdAt: 1
        };
        let query = {
            company: ObjectId(req.user.company),
            ...(!!toDate &&
                !!fromDate && {
                    GTRequestDate: {
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
                $unwind: "$GTRequestDetails"
            },
            {
                $addFields: {
                    GTStatus: {
                        $cond: [
                            {
                                $and: [
                                    {$eq: ["$GTRequestDetails.balancedQty", 0]},
                                    {$ne: ["$GTRequestDetails.GTRequestQty", 0]}
                                ]
                            },
                            "Fulfilled",
                            {
                                $cond: [
                                    {
                                        $and: [
                                            {$eq: ["$GTRequestDetails.balancedQty", "$GTRequestDetails.GTRequestQty"]},
                                            {$ne: ["$status", "Rejected"]}
                                        ]
                                    },
                                    "Awaiting Issue",
                                    {$cond: [{$eq: ["$status", "Rejected"]}, "Rejected", "Partially Fulfilled"]}
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $match: {
                    ...(!!status && {
                        GTStatus: status == "All" ? {$exists: true} : status
                    })
                }
            }
        ];
        let rows = await GoodsTransferRequestRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            statusOptions: ["All", "Awaiting Issue", "Partially Fulfilled", "Fulfilled", "Rejected"],
            ...rows
        });
    } catch (e) {
        console.error("getAllGRSummaryReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllBOMItemsForGTR = asyncHandler(async (req, res) => {
    try {
        const {department = null, location = null, SKUId = null, batchQty = 1} = req.query;
        const BOMOfSKUExists = await BOMOfSKURepository.findOneDoc({SKU: SKUId}, {_id: 1});
        let itemsList = [];
        if (BOMOfSKUExists) {
            itemsList = await filteredBoMOfSKUList([
                {
                    $match: {
                        SKU: ObjectId(SKUId)
                    }
                },
                {
                    $unwind: "$BOMOfSKUDetails"
                },
                {
                    $lookup: {
                        from: "Items",
                        localField: "BOMOfSKUDetails.reference",
                        foreignField: "_id",
                        pipeline: [
                            {
                                $project: {
                                    primaryToSecondaryConversion: 1,
                                    secondaryToPrimaryConversion: 1,
                                    primaryUnit: 1,
                                    secondaryUnit: 1,
                                    conversionOfUnits: 1
                                }
                            }
                        ],
                        as: "itemInfo"
                    }
                },
                {
                    $lookup: {
                        from: "ProductionItem",
                        localField: "BOMOfSKUDetails.reference",
                        foreignField: "_id",
                        pipeline: [
                            {
                                $project: {
                                    primaryToSecondaryConversion: 1,
                                    secondaryToPrimaryConversion: 1,
                                    primaryUnit: 1,
                                    secondaryUnit: 1,
                                    conversionOfUnits: 1
                                }
                            }
                        ],
                        as: "prodItemInfo"
                    }
                },
                {
                    $lookup: {
                        from: "JobWorkItemMaster",
                        localField: "BOMOfSKUDetails.reference",
                        foreignField: "_id",
                        pipeline: [
                            {
                                $project: {
                                    primaryToSecondaryConversion: 1,
                                    secondaryToPrimaryConversion: 1,
                                    primaryUnit: 1,
                                    secondaryUnit: 1,
                                    conversionOfUnits: 1
                                }
                            }
                        ],
                        as: "JWItemInfo"
                    }
                },
                {
                    $addFields: {
                        itemInfo: {$concatArrays: ["$itemInfo", "$prodItemInfo", "$JWItemInfo"]}
                    }
                },
                {
                    $unwind: "$itemInfo"
                },
                {
                    $lookup: {
                        from: "InventoryCorrection",
                        localField: "BOMOfSKUDetails.reference",
                        foreignField: "item",
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $or: [
                                            {
                                                $and: [
                                                    {$eq: ["$referenceModel", "ProductionItem"]},
                                                    {$eq: ["$departmentName", department]}
                                                ]
                                            },
                                            {
                                                $and: [
                                                    {$ne: ["$referenceModel", "ProductionItem"]},
                                                    {
                                                        $or: [
                                                            {$eq: ["$department", department]},
                                                            {$eq: ["$departmentName", department]}
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    deliveryLocation: location
                                }
                            },
                            {
                                $addFields: {
                                    convertedClosedIRQty: {
                                        $cond: [
                                            {$eq: ["$UOM", "$primaryUnit"]},
                                            {
                                                $cond: [
                                                    {
                                                        $not: ["$primaryToSecondaryConversion"]
                                                    },
                                                    {
                                                        $cond: [
                                                            {
                                                                $or: [
                                                                    {$not: ["$secondaryToPrimaryConversion"]},
                                                                    {$eq: ["$secondaryUnit", "-"]}
                                                                ]
                                                            },
                                                            "$closedIRQty",
                                                            {
                                                                $divide: [
                                                                    "$closedIRQty",
                                                                    "$secondaryToPrimaryConversion"
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        $multiply: ["$closedIRQty", "$primaryToSecondaryConversion"]
                                                    }
                                                ]
                                            },
                                            "$closedIRQty"
                                        ]
                                    },
                                    UOM: {
                                        $cond: [
                                            {$or: [{$eq: ["$secondaryUnit", "-"]}, {$not: ["$secondaryUnit"]}]},
                                            "$UOM",
                                            "$secondaryUnit"
                                        ]
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: {itemId: "$item", UOM: "$UOM", width: "$width", length: "$length"},
                                    closedIRQty: {$sum: "$convertedClosedIRQty"},
                                    primaryToSecondaryConversion: {$first: "$primaryToSecondaryConversion"},
                                    secondaryToPrimaryConversion: {$first: "$secondaryToPrimaryConversion"},
                                    primaryUnit: {$first: "$primaryUnit"},
                                    secondaryUnit: {$first: "$secondaryUnit"},
                                    conversionOfUnits: {$first: "$conversionOfUnits"},
                                    conversionOfUnits: {$first: "$conversionOfUnits"}
                                }
                            },
                            {
                                $project: {
                                    IRQty: {$round: ["$closedIRQty", 4]},
                                    UOM: "$_id.UOM",
                                    primaryToSecondaryConversion: 1,
                                    secondaryToPrimaryConversion: 1,
                                    primaryUnit: 1,
                                    secondaryUnit: 1,
                                    conversionOfUnits: 1,
                                    conversionOfUnits: 1
                                }
                            }
                        ],
                        as: "inventory"
                    }
                },
                {
                    $unwind: {
                        path: "$inventory",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 0,
                        GTRequestLineNumber: {$literal: 0},
                        item: "$BOMOfSKUDetails.reference",
                        refItems: "$BOMOfSKUDetails.referenceModel",
                        itemCode: "$BOMOfSKUDetails.itemCode",
                        itemName: "$BOMOfSKUDetails.itemName",
                        itemDescription: "$BOMOfSKUDetails.itemDescription",
                        UOM: {$ifNull: ["$inventory.UOM", "$BOMOfSKUDetails.UOM"]},
                        primaryToSecondaryConversion: {
                            $ifNull: [
                                "$inventory.primaryToSecondaryConversion",
                                "$itemInfo.primaryToSecondaryConversion"
                            ]
                        },
                        secondaryToPrimaryConversion: {
                            $ifNull: [
                                "$inventory.secondaryToPrimaryConversion",
                                "$itemInfo.secondaryToPrimaryConversion"
                            ]
                        },
                        primaryUnit: {$ifNull: ["$inventory.primaryUnit", "$itemInfo.primaryUnit"]},
                        secondaryUnit: {$ifNull: ["$inventory.secondaryUnit", "$itemInfo.secondaryUnit"]},
                        conversionOfUnits: {$ifNull: ["$inventory.conversionOfUnits", "$itemInfo.conversionOfUnits"]},
                        IRQty: {$ifNull: ["$inventory.IRQty", 0]},
                        GTRequestQty: {$round: [{$multiply: ["$BOMOfSKUDetails.partCount", {$toInt: batchQty}]}, 2]},
                        GTQty: {$literal: 0},
                        balancedQty: {$literal: 0},
                        previousGTRequestQty: {$literal: 0}
                    }
                }
            ]);
        }
        return res.success({
            itemsList,
            message: !BOMOfSKUExists ? "GTR can't be created. BOM is not defined for selected SKU." : null
        });
    } catch (error) {
        console.error("getAllBOMItemsForGTR Goods Transfer Request", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
