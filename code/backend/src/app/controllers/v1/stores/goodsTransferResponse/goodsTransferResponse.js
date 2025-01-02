const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllGoodsTransferResponseAttributes
} = require("../../../../models/stores/helpers/goodsTransferResponseHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {GOODS_TRANSFER_RESPONSE} = require("../../../../mocks/schemasConstant/storesConstant");
const GoodsTransferResponseRepository = require("../../../../models/stores/repository/goodsTransferResponseRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const InventoryRepository = require("../../../../models/stores/repository/inventoryCorrectionRepository");
const WIPInventoryRepository = require("../../../../models/planning/repository/WIPInventoryRepository");
const GTReqRepository = require("../../../../models/planning/repository/goodsTransferRequestRepository");
const {
    updateGTRQtyOnGTResponse,
    updateGTRQtyOnGTResponseRejected
} = require("../../planning/goodsTransferRequest/goodsTransferRequest");
const {getAllCheckedItemCategoriesList} = require("../../purchase/itemCategoryMaster/itemCategoryMaster");
const {setConversion} = require("../../../../helpers/utility");
const {GOODS_TRANSFER_REQUEST_DEPT} = require("../../../../mocks/constantData");
const {
    filteredProductionUnitConfigList
} = require("../../../../models/planning/repository/productionUnitConfigRepository");
const {
    filteredInventoryDepartmentsList
} = require("../../../../models/settings/repository/inventoryDepartmentsRepository");
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllGoodsTransferResponseAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company), status: OPTIONS.defaultStatus.AWAITING_APPROVAL}}
        ];
        let rows = await GoodsTransferResponseRepository.getAllPaginate({
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
        const itemDetails = await GoodsTransferResponseRepository.createDoc(createdObj);
        if (itemDetails) {
            await updateGTRAndInventory(itemDetails, req.user, "create");
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Goods Transfer")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Goods Transfer", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await GoodsTransferResponseRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await GoodsTransferResponseRepository.updateDoc(itemDetails, req.body);
        if (itemDetails) {
            if (req.body.status == OPTIONS.defaultStatus.REJECTED) {
                await updateGTRAndInventoryRejected(itemDetails, req.user);
            } else {
                await updateGTRAndInventory(itemDetails, req.user, "update");
            }
            if (req.body.status == OPTIONS.defaultStatus.APPROVED) {
                await insertWIPInventory(req.user, itemDetails._id);
            }
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Goods Transfer has been")
        });
    } catch (e) {
        console.error("update Goods Transfer", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const insertWIPInventory = async (user, id) => {
    try {
        let itemCategoryArray = await getAllCheckedItemCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            stockPreparation: true
        });
        itemCategoryArray = itemCategoryArray.map(x => x.category);
        let WIPList = await GoodsTransferResponseRepository.filteredGoodsTransferResponseList([
            {
                $match: {
                    _id: ObjectId(id)
                }
            },
            {
                $project: {toDepartment: 1, location: 1, GTDetails: 1}
            },
            {$unwind: "$GTDetails"},
            {$unwind: "$GTDetails.FIFO"},
            {
                $match: {
                    "GTDetails.FIFO.GTQty": {$gt: 0}
                }
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "GTDetails.item",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                itemType: 1,
                                shelfLife: 1,
                                widthInMM: "$dualUnitsDimensionsDetails.widthInMM",
                                lengthInM: "$dualUnitsDimensionsDetails.lengthInM",
                                sqmPerRoll: "$dualUnitsDimensionsDetails.sqmPerRoll"
                            }
                        }
                    ],
                    as: "GTDetails.item"
                }
            },
            {$unwind: "$GTDetails.item"},
            {
                $match: {
                    "GTDetails.item.itemType": {$in: itemCategoryArray}
                }
            },
            {
                $project: {
                    _id: 0,
                    company: user.company,
                    createdBy: user.sub,
                    updatedBy: user.sub,
                    MRN: "$GTDetails.FIFO.MRN",
                    MRNDate: "$GTDetails.FIFO.MRNDate",
                    MRNNumber: "$GTDetails.FIFO.MRNNo",
                    GIN: "$GTDetails.FIFO.GIN",
                    GINDate: "$GTDetails.FIFO.GINDate",
                    expiryDate: "$GTDetails.FIFO.expiryDate",
                    item: "$GTDetails.item._id",
                    itemCode: "$GTDetails.itemCode",
                    itemType: "$GTDetails.item.itemType",
                    itemName: "$GTDetails.itemName",
                    itemDescription: "$GTDetails.itemDescription",
                    shelfLife: "$GTDetails.item.shelfLife",
                    unitConversion: "$GTDetails.conversionOfUnits",
                    primaryToSecondaryConversion: "$GTDetails.primaryToSecondaryConversion",
                    secondaryToPrimaryConversion: "$GTDetails.secondaryToPrimaryConversion",
                    primaryUnit: "$GTDetails.primaryUnit",
                    secondaryUnit: "$GTDetails.secondaryUnit",
                    UOM: "$GTDetails.UOM",
                    PPICQty: "$GTDetails.GTQty",
                    width: {$ifNull: ["$GTDetails.item.widthInMM", 0]},
                    length: {$ifNull: ["$GTDetails.item.lengthInM", 0]},
                    SQM: {$ifNull: ["$GTDetails.item.sqmPerRoll", 0]},
                    roll: {
                        $literal: 0
                    },
                    department: "$toDepartment",
                    deliveryLocation: "$location"
                }
            }
        ]);
        if (WIPList.length > 0) {
            await WIPInventoryRepository.insertManyDoc(WIPList);
        }
    } catch (e) {
        console.error(e);
    }
};
const updateGTRAndInventory = async (itemDetails, user, action) => {
    try {
        let bulkInventory = [];
        const productionUnitOptions = await filteredProductionUnitConfigList([
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $project: {
                    _id: 1,
                    prodUnit: {$concat: ["$prodUnitName", " ", "(", "$prodUnitCode", ")"]}
                }
            }
        ]);
        const departmentOptions = await filteredInventoryDepartmentsList([
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $project: {
                    _id: 1,
                    departmentName: 1
                }
            }
        ]);
        let prodUnitMap = new Map(productionUnitOptions.map(x => [x?.prodUnit, x?._id]));
        let deptMap = new Map(departmentOptions.map(x => [x?.departmentName, x?._id]));
        for await (const GTDetail of itemDetails.GTDetails) {
            for (const FIFO of GTDetail.FIFO) {
                if (FIFO.GTQty > 0) {
                    let closedIRQty = FIFO.IRQty - FIFO.GTQty;
                    let UOMConvertData = {
                        UOM: FIFO.UOM,
                        quantity: closedIRQty,
                        primaryUnit: GTDetail.primaryUnit,
                        secondaryUnit: GTDetail.secondaryUnit,
                        primaryToSecondaryConversion: GTDetail.primaryToSecondaryConversion,
                        secondaryToPrimaryConversion: GTDetail.secondaryToPrimaryConversion
                    };
                    if (GTDetail.UOM != FIFO.UOM) {
                        closedIRQty = setConversion(UOMConvertData);
                    }
                    let updateInventory = {
                        updateOne: {
                            filter: {_id: FIFO.IC},
                            update: {
                                $set: {closedIRQty: closedIRQty}
                            }
                        }
                    };
                    bulkInventory.push(updateInventory);
                    if (itemDetails.status == OPTIONS.defaultStatus.APPROVED) {
                        if (prodUnitMap.get(itemDetails?.toDepartmentName)) {
                            let newInventoryDoc = await InventoryRepository.getDocById(FIFO.IC, {_id: 0});
                            newInventoryDoc.department = itemDetails.toDepartment;
                            newInventoryDoc.departmentName = itemDetails.toDepartmentName;
                            newInventoryDoc.departmentId = prodUnitMap.get(itemDetails?.toDepartmentName);
                            newInventoryDoc.refDepartment = "ProductionUnitConfig";
                            if (itemDetails?.fromDepartment == GOODS_TRANSFER_REQUEST_DEPT.STORES) {
                                newInventoryDoc.invZoneName = "Main Store";
                                newInventoryDoc.invZoneId = "66ee25dbbadf15f481a1f25b";
                            }
                            newInventoryDoc.closedIRQty = FIFO.GTQty;
                            newInventoryDoc.UOM = GTDetail.UOM;
                            let insertInventory = {
                                insertOne: {
                                    document: newInventoryDoc
                                }
                            };
                            bulkInventory.push(insertInventory);
                        } else {
                            let newInventoryDoc = await InventoryRepository.getDocById(FIFO.IC, {_id: 0});
                            newInventoryDoc.department = itemDetails.toDepartment;
                            newInventoryDoc.departmentName = itemDetails.toDepartmentName;
                            newInventoryDoc.departmentId = deptMap.get(itemDetails.toDepartment);
                            newInventoryDoc.refDepartment = "InventoryDepartments";
                            newInventoryDoc.closedIRQty = FIFO.GTQty;
                            newInventoryDoc.UOM = GTDetail.UOM;
                            let insertInventory = {
                                insertOne: {
                                    document: newInventoryDoc
                                }
                            };
                            bulkInventory.push(insertInventory);
                        }
                    }
                }
            }
        }
        if (bulkInventory.length > 0) {
            await InventoryRepository.bulkWriteDoc(bulkInventory);
        }
        for await (let i of itemDetails.GTDetails) {
            await updateGTRQtyOnGTResponse(
                user.sub,
                itemDetails.GTRequest.valueOf(),
                i.GTRequestLineNumber,
                i.item.valueOf(),
                i.GTQty,
                action
            );
        }
    } catch (error) {
        console.error(error);
    }
};
const updateGTRAndInventoryRejected = async (itemDetails, user) => {
    try {
        let bulkUpdateOperations = [];
        for await (const GTDetail of itemDetails.GTDetails) {
            for (const FIFO of GTDetail.FIFO) {
                let closedIRQty = FIFO.GTQty;
                if (closedIRQty > 0) {
                    let UOMConvertData = {
                        UOM: FIFO.UOM,
                        quantity: closedIRQty,
                        primaryUnit: GTDetail.primaryUnit,
                        secondaryUnit: GTDetail.secondaryUnit,
                        primaryToSecondaryConversion: GTDetail.primaryToSecondaryConversion,
                        secondaryToPrimaryConversion: GTDetail.secondaryToPrimaryConversion
                    };
                    if (GTDetail.UOM != FIFO.UOM) {
                        closedIRQty = setConversion(UOMConvertData);
                    }
                    let updateQtyObj = {closedIRQty: closedIRQty};
                    let updateOperation = {
                        updateOne: {
                            filter: {_id: FIFO.IC},
                            update: {
                                $inc: updateQtyObj
                            }
                        }
                    };
                    bulkUpdateOperations.push(updateOperation);
                }
            }
        }
        if (bulkUpdateOperations.length > 0) {
            if (itemDetails.fromDepartment == GOODS_TRANSFER_REQUEST_DEPT.STORES) {
                await InventoryRepository.bulkWriteDoc(bulkUpdateOperations);
            } else {
                await WIPInventoryRepository.bulkWriteDoc(bulkUpdateOperations);
            }
        }
        for await (let i of itemDetails.GTDetails) {
            await updateGTRQtyOnGTResponseRejected(
                user.sub,
                itemDetails.GTRequest.valueOf(),
                i.GTRequestLineNumber,
                i.item.valueOf(),
                i.GTQty
            );
        }
    } catch (error) {
        console.error(error);
    }
};
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await GoodsTransferResponseRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Goods Transfer")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Goods Transfer");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Goods Transfer", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        // let existing = await GoodsTransferResponseRepository.getDocById(req.params.id);
        let existing = await GoodsTransferResponseRepository.filteredGoodsTransferResponseList([
            {
                $match: {
                    _id: ObjectId(req.params.id)
                }
            },
            {
                $addFields: {
                    GTDetails: {
                        $map: {
                            input: "$GTDetails",
                            as: "details",
                            in: {
                                $mergeObjects: [
                                    "$$details",
                                    {
                                        FIFO: {
                                            $map: {
                                                input: "$$details.FIFO",
                                                as: "fifo",
                                                in: {
                                                    $mergeObjects: [
                                                        "$$fifo",
                                                        {
                                                            aging: {
                                                                $cond: {
                                                                    if: {
                                                                        $or: [
                                                                            {$eq: ["$$fifo.expiryDate", null]},
                                                                            {
                                                                                $gte: [
                                                                                    "$$fifo.expiryDate",
                                                                                    {
                                                                                        $add: [
                                                                                            new Date(),
                                                                                            30 * 24 * 60 * 60 * 1000
                                                                                        ]
                                                                                    }
                                                                                ]
                                                                            }
                                                                        ]
                                                                    },
                                                                    then: "green",
                                                                    else: {
                                                                        $cond: {
                                                                            if: {
                                                                                $gt: ["$$fifo.expiryDate", new Date()]
                                                                            },
                                                                            then: "yellow",
                                                                            else: "red"
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        ]);
        if (existing.length == 0) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Goods Transfer");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing[0]);
    } catch (e) {
        console.error("getById Goods Transfer", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            GOODS_TRANSFER_RESPONSE.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
        const GTRequestOptions = await GTReqRepository.filteredGoodsTransferRequestList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.APPROVED,
                    "GTRequestDetails.balancedQty": {$gt: 0}
                }
            },
            {
                $project: {
                    GTRequest: "$_id",
                    GTRequestNo: 1,
                    GTRequestDate: {$dateToString: {format: "%Y-%m-%d", date: "$GTRequestDate"}},
                    location: 1,
                    toDepartment: 1,
                    fromDepartment: 1,
                    toDepartmentName: 1,
                    fromDepartmentName: 1
                }
            }
        ]);
        return res.success({autoIncrementNo, GTRequestOptions});
    } catch (error) {
        console.error("getAllMasterData Goods Transfer", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getItemByGTRequestId = asyncHandler(async (req, res) => {
    try {
        let requestedItemsList = await GTReqRepository.filteredGoodsTransferRequestList([
            {
                $match: {
                    _id: ObjectId(req.params.id)
                }
            },
            {
                $project: {
                    GTRequestDetails: 1,
                    fromDepartment: 1,
                    fromDepartmentName: 1
                }
            },
            {$unwind: "$GTRequestDetails"},
            {
                $match: {
                    "GTRequestDetails.balancedQty": {$gt: 0}
                }
            },
            {
                $lookup: {
                    from: "InventoryCorrection",
                    let: {fromDepartment: "$fromDepartment", fromDepartmentName: "$fromDepartmentName"},
                    localField: "GTRequestDetails.item",
                    foreignField: "item",
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        {
                                            $and: [
                                                {$eq: ["$referenceModel", "ProductionItem"]},
                                                {$eq: ["$departmentName", "$$fromDepartmentName"]}
                                            ]
                                        },
                                        {
                                            $and: [
                                                {$ne: ["$referenceModel", "ProductionItem"]},
                                                {$eq: ["$department", "$$fromDepartment"]}
                                            ]
                                        }
                                    ]
                                },
                                closedIRQty: {$gt: 0}
                            }
                        },
                        {
                            $lookup: {
                                from: "Items",
                                let: {date: "$GINDate"},
                                localField: "item",
                                foreignField: "_id",
                                pipeline: [
                                    {$sort: {itemCode: 1}},
                                    {
                                        $project: {
                                            expiryDate: {
                                                $cond: [
                                                    {$not: ["$shelfLife"]},
                                                    null,
                                                    {
                                                        $dateAdd: {
                                                            startDate: "$$date",
                                                            unit: "month",
                                                            amount: "$shelfLife"
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                ],
                                as: "item"
                            }
                        },
                        {
                            $unwind: {
                                path: "$item",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $addFields: {
                                "item.expiryDate": {$ifNull: ["$item.expiryDate", {$ifNull: ["$expiryDate", null]}]}
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                GINDate: 1,
                                IC: "$_id",
                                GIN: 1,
                                MRN: 1,
                                MRNNo: "$MRNNumber",
                                MRNDate: {$ifNull: ["$MRNDate", null]},
                                expiryDate: "$item.expiryDate",
                                aging: {
                                    $cond: {
                                        if: {
                                            $or: [
                                                {$not: ["$item.expiryDate"]},
                                                {$eq: ["$item.expiryDate", null]},
                                                {
                                                    $gte: [
                                                        "$item.expiryDate",
                                                        {$add: [new Date(), 30 * 24 * 60 * 60 * 1000]}
                                                    ]
                                                }
                                            ]
                                        },
                                        then: "green",
                                        else: {
                                            $cond: {
                                                if: {
                                                    $gt: ["$item.expiryDate", new Date()]
                                                },
                                                then: "yellow",
                                                else: "red"
                                            }
                                        }
                                    }
                                },
                                UOM: 1,
                                IRQty: "$closedIRQty",
                                GTQty: {$literal: 0}
                            }
                        },
                        {
                            $group: {
                                _id: {MRN: "$MRN", UOM: "$UOM"},
                                GINDate: {$first: "$GINDate"},
                                IC: {$first: "$IC"},
                                GIN: {$first: "$GIN"},
                                MRN: {$first: "$MRN"},
                                MRNNo: {$first: "$MRNNo"},
                                MRNDate: {$first: "$MRNDate"},
                                expiryDate: {$first: "$expiryDate"},
                                aging: {$first: "$aging"},
                                UOM: {$first: "$UOM"},
                                IRQty: {$sum: "$IRQty"},
                                GTQty: {$first: "$GTQty"}
                            }
                        },
                        {
                            $project: {
                                _id: 0
                            }
                        },
                        {
                            $sort: {
                                MRNDate: 1
                            }
                        }
                    ],
                    as: "inventory"
                }
            },
            {
                $project: {
                    GTLineNumber: {$literal: 0},
                    GTRequestLineNumber: "$GTRequestDetails.GTRequestLineNumber",
                    item: "$GTRequestDetails.item",
                    refItems: "$GTRequestDetails.refItems",
                    itemCode: "$GTRequestDetails.itemCode",
                    itemName: "$GTRequestDetails.itemName",
                    itemDescription: "$GTRequestDetails.itemDescription",
                    UOM: "$GTRequestDetails.UOM",
                    conversionOfUnits: "$GTRequestDetails.conversionOfUnits",
                    primaryToSecondaryConversion: "$GTRequestDetails.primaryToSecondaryConversion",
                    secondaryToPrimaryConversion: "$GTRequestDetails.secondaryToPrimaryConversion",
                    primaryUnit: "$GTRequestDetails.primaryUnit",
                    secondaryUnit: "$GTRequestDetails.secondaryUnit",
                    IRQty: "$GTRequestDetails.IRQty",
                    GTRQty: "$GTRequestDetails.balancedQty",
                    GTQty: {$literal: 0},
                    FIFO: "$inventory"
                }
            }
        ]);
        if (requestedItemsList.length > 0) {
            requestedItemsList = requestedItemsList.map(x => {
                x.FIFO = x.FIFO.map(FI => {
                    let UOMConvertData = {
                        UOM: x.UOM,
                        quantity: FI.IRQty,
                        primaryUnit: x.primaryUnit,
                        secondaryUnit: x.secondaryUnit,
                        primaryToSecondaryConversion: x.primaryToSecondaryConversion,
                        secondaryToPrimaryConversion: x.secondaryToPrimaryConversion
                    };
                    if (x.UOM != FI.UOM) {
                        FI.IRQty = setConversion(UOMConvertData);
                    }
                    FI.IRQty = +FI.IRQty.toFixed(3);
                    return FI;
                });
                return x;
            });
        }
        return res.success(requestedItemsList);
    } catch (e) {
        console.error("getItemByGTRequestId Goods Transfer", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
