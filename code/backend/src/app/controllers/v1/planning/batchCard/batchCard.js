const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllBatchCardAttributes,
    getAllBCInkAttributes
} = require("../../../../models/planning/helpers/batchCardHelper");
const BatchCardRepository = require("../../../../models/planning/repository/batchCardRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const ProdItemRepository = require("../../../../models/planning/repository/prodItemRepository");
const {getIncrementNumWithPrefix, setConversion} = require("../../../../helpers/utility");
const ProductionUnitConfigRepository = require("../../../../models/planning/repository/productionUnitConfigRepository");
const BOMOfProdItemRepository = require("../../../../models/planning/repository/BOMRepository/BOMOfProdItemRepository");
const InventoryRepository = require("../../../../models/stores/repository/inventoryCorrectionRepository");
const {GOODS_TRANSFER_REQUEST_DEPT, MODULE_PARENT_ID} = require("../../../../mocks/constantData");
const {filteredSubModuleManagementList} = require("../../../../models/settings/repository/subModuleRepository");
const {filteredJobCardList} = require("../../../../models/planning/repository/jobCardRepository");
const {filteredBoMOfSKUList} = require("../../../../models/planning/repository/BOMRepository/BoMOfSKURepository");
const {filteredProdItemCategoryList} = require("../../../../models/settings/repository/prodItemCategoryRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        const {prodUnitConfig = null} = req.query;
        let project = getAllBatchCardAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.ACTIVE,
                    ...(!!prodUnitConfig && {prodUnitId: ObjectId(prodUnitConfig)})
                }
            },
            {
                $lookup: {
                    from: "BatchCard",
                    localField: "_id",
                    foreignField: "item",
                    pipeline: [
                        {
                            $group: {
                                _id: "$item",
                                batchQty: {
                                    $sum: {$cond: [{$eq: ["$status", OPTIONS.defaultStatus.APPROVED]}, "$batchQty", 0]}
                                },
                                batchCardId: {$last: "$_id"},
                                productionUnit: {$last: "$productionUnit"},
                                prodUnitConfig: {$last: "$prodUnitConfig"},
                                batchCardDate: {$last: "$batchCardDate"},
                                batchCardNo: {$last: "$batchCardNo"},
                                lastBatchQty: {$last: "$batchQty"},
                                status: {$last: "$status"}
                            }
                        }
                    ],
                    as: "batchCard"
                }
            },
            {
                $unwind: {
                    path: "$batchCard",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "InventoryCorrection",
                    let: {batchUnit: "$unitOfMeasurement"},
                    localField: "_id",
                    foreignField: "item",
                    pipeline: [
                        {
                            $addFields: {
                                convertedClosedIRQty: {
                                    $cond: [
                                        {$eq: ["$UOM", "$$batchUnit"]},
                                        "$closedIRQty",
                                        {
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
                                                                        {
                                                                            $not: ["$secondaryToPrimaryConversion"]
                                                                        },
                                                                        {$eq: ["$secondaryUnit", "-"]}
                                                                    ]
                                                                },
                                                                "$closedIRQty",
                                                                {
                                                                    $multiply: [
                                                                        "$closedIRQty",
                                                                        "$secondaryToPrimaryConversion"
                                                                    ]
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            $divide: ["$closedIRQty", "$primaryToSecondaryConversion"]
                                                        }
                                                    ]
                                                },
                                                {
                                                    $cond: [
                                                        {
                                                            $not: ["$primaryToSecondaryConversion"]
                                                        },
                                                        {
                                                            $cond: [
                                                                {
                                                                    $or: [
                                                                        {
                                                                            $not: ["$secondaryToPrimaryConversion"]
                                                                        },
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
                                                }
                                            ]
                                        }
                                    ]
                                },
                                UOM: "$$batchUnit"
                            }
                        },
                        {
                            $group: {
                                _id: "$item",
                                closedIRQty: {$sum: "$convertedClosedIRQty"},
                                UOM: {$last: "$UOM"}
                            }
                        }
                    ],
                    as: "invInfo"
                }
            },
            {
                $unwind: {
                    path: "$invInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "ProdItemCategory",
                    localField: "prodItemCategory",
                    foreignField: "category",
                    pipeline: [{$project: {_id: 0, categoryCode: 1}}],
                    as: "itemCategoryInfo"
                }
            },
            {
                $unwind: {
                    path: "$itemCategoryInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "BOMOfProdItem",
                    localField: "_id",
                    foreignField: "item",
                    pipeline: [{$project: {_id: 1}}],
                    as: "BOMOfProdItemInfo"
                }
            },
            {
                $lookup: {
                    from: "ProdProcessFlow",
                    let: {prodUnitId: "$prodUnitId", itemId: "$_id"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{$eq: ["$prodUnitConfig", "$$prodUnitId"]}, {$eq: ["$item", "$$itemId"]}]
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1
                            }
                        }
                    ],
                    as: "prodProcessFlow"
                }
            }
        ];
        let rows = await ProdItemRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });

        return res.success({...rows});
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
        const itemDetails = await BatchCardRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Batch Card")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Batch Card", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await BatchCardRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        if (
            req.body.status == OPTIONS.defaultStatus.APPROVED &&
            !["Ink Batch", "Stock Batch"].includes(req.body.batchType)
        ) {
            const itemsOutOfStock = await checkInvForBOMItems({
                prodItemId: req.body?.item,
                prodUnitId: req.body?.prodUnitConfig,
                batchQty: req.body?.batchQty
            });
            if (itemsOutOfStock?.length) {
                return res.success(itemsOutOfStock.join(", "));
            }
        }
        itemDetails = await BatchCardRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Batch Card has been")
        });
    } catch (e) {
        console.error("update Batch Card", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const checkInvForBOMItems = async info => {
    try {
        let itemsOutOfStock = [];
        let BOMInfo = await BOMOfProdItemRepository.findOneDoc(
            {item: info.prodItemId},
            {
                BOMOfProdItemDetails: 1
            }
        );
        let invItemsGroupedData = [];
        for await (const BOMItem of BOMInfo?.BOMOfProdItemDetails) {
            let transferQty = BOMItem?.totalQtyPerPC * +info?.batchQty;
            // console.log("transferQty", transferQty, "BOMItem?.UOM", BOMItem?.UOM);
            const itemsInv = await InventoryRepository.filteredInventoryCorrectionList([
                {
                    $match: {
                        item: ObjectId(BOMItem?.reference),
                        $or: [
                            {
                                $or: [
                                    {departmentId: ObjectId(info?.prodUnitId)},
                                    {department: GOODS_TRANSFER_REQUEST_DEPT.PRODUCTION}
                                ]
                            },
                            {department: GOODS_TRANSFER_REQUEST_DEPT.STORES}
                        ],
                        closedIRQty: {$gt: 0}
                    }
                },
                {
                    $sort: {
                        createdAt: 1
                    }
                },
                {
                    $addFields: {
                        convertedClosedIRQty: {
                            $cond: [
                                {$eq: ["$UOM", BOMItem?.UOM]},
                                "$closedIRQty",
                                {
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
                                                            $multiply: ["$closedIRQty", "$secondaryToPrimaryConversion"]
                                                        }
                                                    ]
                                                },
                                                {
                                                    $divide: ["$closedIRQty", "$primaryToSecondaryConversion"]
                                                }
                                            ]
                                        },
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
                                        }
                                    ]
                                }
                            ]
                        },
                        transferQty: transferQty,
                        UOM: BOMItem.UOM
                    }
                },
                {
                    $group: {
                        _id: "$item",
                        invIdArray: {$addToSet: "$_id"},
                        closedIRQty: {$sum: "$convertedClosedIRQty"},
                        transferQty: {$first: "$transferQty"},
                        UOM: {$first: "$UOM"}
                    }
                }
            ]);
            // console.log("itemsInv", itemsInv);
            if (itemsInv?.length) {
                if (+itemsInv[0]?.closedIRQty < +transferQty) {
                    itemsOutOfStock.push(BOMItem?.itemCode);
                }
                invItemsGroupedData.push(...itemsInv);
            } else {
                itemsOutOfStock.push(BOMItem?.itemCode);
            }
        }
        if (itemsOutOfStock?.length) {
            return itemsOutOfStock;
        }
        for await (const ele of invItemsGroupedData) {
            const itemsInvForTransfer = await InventoryRepository.filteredInventoryCorrectionList([
                {
                    $match: {
                        $expr: {
                            $in: ["$_id", ele?.invIdArray]
                        }
                    }
                },
                {
                    $sort: {createdAt: 1}
                },
                {
                    $addFields: {
                        sortPriority: {
                            $cond: [
                                {
                                    $or: [
                                        {$eq: ["$departmentId", ObjectId(info?.prodUnitId)]},
                                        {$eq: ["$department", GOODS_TRANSFER_REQUEST_DEPT.PRODUCTION]}
                                    ]
                                },
                                1,
                                {$cond: [{$eq: ["$department", GOODS_TRANSFER_REQUEST_DEPT.STORES]}, 2, 3]}
                            ]
                        }
                    }
                },
                {
                    $sort: {
                        sortPriority: 1
                    }
                },
                {
                    $addFields: {
                        convertedClosedIRQty: {
                            $cond: [
                                {$eq: ["$UOM", ele?.UOM]},
                                "$closedIRQty",
                                {
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
                                                            $multiply: ["$closedIRQty", "$secondaryToPrimaryConversion"]
                                                        }
                                                    ]
                                                },
                                                {
                                                    $divide: ["$closedIRQty", "$primaryToSecondaryConversion"]
                                                }
                                            ]
                                        },
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
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        item: "$item",
                        convertedClosedIRQty: "$convertedClosedIRQty",
                        itemCode: 1,
                        refDepartment: 1,
                        department: 1,
                        departmentName: 1
                    }
                }
            ]);
            // console.log("itemsInvForTransfer", itemsInvForTransfer);
            for await (const item of itemsInvForTransfer) {
                const invObj = await InventoryRepository.getDocById(item._id, {
                    itemCode: 1,
                    UOM: 1,
                    closedIRQty: 1,
                    primaryUnit: 1,
                    secondaryUnit: 1,
                    primaryToSecondaryConversion: 1,
                    secondaryToPrimaryConversion: 1
                });
                // console.log("transferQty before", ele?.transferQty);
                if (ele?.transferQty > item?.convertedClosedIRQty) {
                    ele.transferQty = +ele?.transferQty - +item?.convertedClosedIRQty;
                    invObj.closedIRQty = 0;
                    // console.log("ele?.transferQty After", ele?.transferQty);
                } else {
                    invObj.closedIRQty = +item?.convertedClosedIRQty - +ele?.transferQty;
                    ele.transferQty = 0;
                    let invUOMConvertData = {
                        UOM: invObj?.UOM,
                        quantity: invObj.closedIRQty,
                        primaryUnit: invObj.primaryUnit,
                        secondaryUnit: invObj.secondaryUnit,
                        primaryToSecondaryConversion: invObj.primaryToSecondaryConversion,
                        secondaryToPrimaryConversion: invObj.secondaryToPrimaryConversion
                    };
                    if (ele?.UOM != invObj?.UOM) {
                        invObj.closedIRQty = setConversion(invUOMConvertData);
                    }
                }
                // console.log("invObj===============", invObj);
                await invObj.save();
                if (ele.transferQty == 0) {
                    break;
                }
            }
        }
        return [];
    } catch (e) {
        console.error("checkInvForBOMItems", e);
    }
};

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await BatchCardRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Batch Card")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Batch Card");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Batch Card", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await BatchCardRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Batch Card");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Batch Card", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let prodUnitData = await ProductionUnitConfigRepository.findOneDoc(
            {_id: req.query.prodUnitConfig},
            {
                batchIncNum: 1,
                prodUnitCode: 1,
                prodUnitName: 1
            }
        );
        const featureConfig = await filteredSubModuleManagementList([
            {
                $match: {
                    _id: ObjectId("66e424b951c5a64a09522902")
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
        let prefix = prodUnitData?.prodUnitCode;
        if (featureConfig?.length) {
            prefix = `${prefix}${
                featureConfig.find(z => z?.featureCode == "MONTH_IN_BATCH_CARD_NO")?.value == "true"
                    ? "/" + String(new Date().getMonth() + 1).padStart(2, "0")
                    : ""
            }`;
        }
        prodUnitData.batchCardNo = getIncrementNumWithPrefix({
            modulePrefix: `${prefix}/`,
            autoIncrementValue: prodUnitData?.batchIncNum ?? 1,
            digit: 4
        });

        return res.success({
            productionUnit: `${prodUnitData?.prodUnitCode}-${prodUnitData?.prodUnitName}`,
            batchCardNo: prodUnitData?.batchCardNo
        });
    } catch (error) {
        console.error("getAllMasterData Batch Card", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getJCOptions = asyncHandler(async (req, res) => {
    try {
        const JCOptions = await filteredJobCardList([
            {
                $match: {
                    company: ObjectId(req.user.company)
                }
            },
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
                    jobCardDate: {$first: "$jobCardDate"},
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
                    jobCardDate: {$dateToString: {format: "%d-%m-%Y", date: "$jobCardDate"}},
                    SKU: "$_id.SKU",
                    SKUNo: 1,
                    SKUName: 1,
                    SKUDescription: 1,
                    UOM: 1,
                    batchQty: 1
                }
            },
            {
                $sort: {jobCardNo: -1}
            }
        ]);
        return res.success(JCOptions);
    } catch (error) {
        console.error("getJCOptions Batch Card", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getBOMOfSKUItems = asyncHandler(async (req, res) => {
    try {
        const {SKUId = null, prodUnitConfig = null} = req.query;
        let prodInkItemsCategory = await filteredProdItemCategoryList([
            {
                $match: {
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE,
                    prodUnitConfigId: prodUnitConfig ? ObjectId(prodUnitConfig) : MODULE_PARENT_ID
                }
            },
            {
                $project: {
                    category: 1
                }
            }
        ]);
        prodInkItemsCategory = prodInkItemsCategory?.map(x => x?.category) || [];
        const itemsList = await filteredBoMOfSKUList([
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
                    from: "ProductionItem",
                    localField: "BOMOfSKUDetails.reference",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $match: {
                                prodItemCategory: {$in: prodInkItemsCategory}
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                prodUnitId: 1
                            }
                        },
                        {
                            $lookup: {
                                from: "BOMOfProdItem",
                                localField: "_id",
                                foreignField: "item",
                                pipeline: [{$project: {totalBatchQty: 1}}],
                                as: "BOMOfProdItemInfo"
                            }
                        },
                        {
                            $unwind: {
                                path: "$BOMOfProdItemInfo",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: "BatchCard",
                                localField: "_id",
                                foreignField: "item",
                                pipeline: [
                                    {
                                        $match: {
                                            status: OPTIONS.defaultStatus.CREATED
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: "$item",
                                            productionUnit: {$last: "$productionUnit"},
                                            prodUnitConfig: {$last: "$prodUnitConfig"},
                                            batchCardDate: {$last: "$batchCardDate"},
                                            batchCode: {$last: "$batchCode"},
                                            MF: {$last: "$MF"},
                                            batchCardNo: {$last: "$batchCardNo"},
                                            lastBatchQty: {$last: "$batchQty"},
                                            status: {$last: "$status"},
                                            batchCardId: {$last: "$_id"},
                                            UOM: {$last: "$UOM"}
                                        }
                                    }
                                ],
                                as: "batchCard"
                            }
                        },
                        {
                            $unwind: {
                                path: "$batchCard",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $project: {
                                BCStatus: "$batchCard.status",
                                productionUnit: "$batchCard.productionUnit",
                                prodUnitConfig: {$ifNull: ["$batchCard.prodUnitConfig", "$prodUnitId"]},
                                batchCode: "$batchCard.batchCode",
                                MF: "$batchCard.MF",
                                batchCardDate: "$batchCard.batchCardDate",
                                batchCardNo: "$batchCard.batchCardNo",
                                lastBatchQty: "$batchCard.lastBatchQty",
                                batchCardId: "$batchCard.batchCardId",
                                totalBatchQty: "$BOMOfProdItemInfo.totalBatchQty",
                                UOM: "$batchCard.UOM"
                            }
                        }
                    ],
                    as: "prodItemInfo"
                }
            },
            {
                $unwind: "$prodItemInfo"
            },
            {
                $lookup: {
                    from: "InventoryCorrection",
                    let: {batchUnit: "$BOMOfSKUDetails.UOM"},
                    localField: "BOMOfSKUDetails.reference",
                    foreignField: "item",
                    pipeline: [
                        {
                            $addFields: {
                                convertedClosedIRQty: {
                                    $cond: [
                                        {$eq: ["$UOM", "$$batchUnit"]},
                                        "$closedIRQty",
                                        {
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
                                                                        {
                                                                            $not: ["$secondaryToPrimaryConversion"]
                                                                        },
                                                                        {$eq: ["$secondaryUnit", "-"]}
                                                                    ]
                                                                },
                                                                "$closedIRQty",
                                                                {
                                                                    $multiply: [
                                                                        "$closedIRQty",
                                                                        "$secondaryToPrimaryConversion"
                                                                    ]
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            $divide: ["$closedIRQty", "$primaryToSecondaryConversion"]
                                                        }
                                                    ]
                                                },
                                                {
                                                    $cond: [
                                                        {
                                                            $not: ["$primaryToSecondaryConversion"]
                                                        },
                                                        {
                                                            $cond: [
                                                                {
                                                                    $or: [
                                                                        {
                                                                            $not: ["$secondaryToPrimaryConversion"]
                                                                        },
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
                                                }
                                            ]
                                        }
                                    ]
                                },
                                UOM: "$$batchUnit"
                            }
                        },
                        {
                            $group: {
                                _id: "$item",
                                closedIRQty: {$sum: "$convertedClosedIRQty"},
                                UOM: {$last: "$UOM"}
                            }
                        }
                    ],
                    as: "invInfo"
                }
            },
            {
                $unwind: {
                    path: "$invInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    BOMQty: {$ifNull: ["$prodItemInfo.totalBatchQty", 0]},
                    SOH: {$ifNull: [{$round: ["$invInfo.closedIRQty", 2]}, 0]}
                }
            },
            {
                $project: {
                    _id: 0,
                    item: "$BOMOfSKUDetails.reference",
                    itemCode: "$BOMOfSKUDetails.itemCode",
                    itemName: "$BOMOfSKUDetails.itemName",
                    itemDescription: "$BOMOfSKUDetails.itemDescription",
                    BOMQty: 1,
                    SOH: 1,
                    toProduce: {$cond: [{$gte: ["$SOH", "$BOMQty"]}, 0, {$subtract: ["$BOMQty", "$SOH"]}]},
                    status: {$ifNull: ["$prodItemInfo.BCStatus", OPTIONS.defaultStatus.INACTIVE]},
                    productionUnit: {$ifNull: ["$prodItemInfo.productionUnit", null]},
                    prodUnitConfig: {$ifNull: ["$prodItemInfo.prodUnitConfig", null]},
                    MF: {$ifNull: ["$prodItemInfo.MF", null]},
                    batchCode: {$ifNull: ["$prodItemInfo.batchCode", null]},
                    batchCardDate: {$ifNull: ["$prodItemInfo.batchCardDate", null]},
                    batchCardNo: {$ifNull: ["$prodItemInfo.batchCardNo", null]},
                    batchCardId: {$ifNull: ["$prodItemInfo.batchCardId", null]},
                    lastBatchQty: {$ifNull: ["$prodItemInfo.lastBatchQty", null]},
                    UOM: {$ifNull: ["$prodItemInfo.UOM", "$BOMOfSKUDetails.UOM"]},
                    BOMOfProdItemExists: {$cond: [{$not: ["$prodItemInfo.totalBatchQty"]}, false, true]}
                }
            }
        ]);
        return res.success(itemsList);
    } catch (error) {
        console.error("getBOMOfSKUItems Batch Card", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getBatchInfo = asyncHandler(async (req, res) => {
    try {
        const {itemId = null} = req.query;
        const batchInfo = await InventoryRepository.filteredInventoryCorrectionList([
            {
                $match: {
                    item: ObjectId(itemId),
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
                    // convertedClosedIRQty: {
                    //     $cond: [
                    //         {$eq: ["$UOM", UOM]},
                    //         "$closedIRQty",
                    //         {
                    //             $cond: [
                    //                 {
                    //                     $not: ["$primaryToSecondaryConversion"]
                    //                 },
                    //                 {
                    //                     $cond: [
                    //                         {
                    //                             $or: [
                    //                                 {$not: ["$secondaryToPrimaryConversion"]},
                    //                                 {$eq: ["$secondaryUnit", "-"]}
                    //                             ]
                    //                         },
                    //                         "$closedIRQty",
                    //                         {
                    //                             $divide: ["$closedIRQty", "$secondaryToPrimaryConversion"]
                    //                         }
                    //                     ]
                    //                 },
                    //                 {
                    //                     $multiply: ["$closedIRQty", "$primaryToSecondaryConversion"]
                    //                 }
                    //             ]
                    //         }
                    //     ]
                    // },
                    // UOM: UOM
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
                                        $gte: ["$item.expiryDate", {$add: [new Date(), 30 * 24 * 60 * 60 * 1000]}]
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
                    IRQty: "$closedIRQty"
                }
            },
            {
                $group: {
                    _id: {MRN: "$MRN", UOM: "$UOM"},
                    batchCardNo: {$first: "$MRNNo"},
                    batchCardDate: {$first: "$MRNDate"},
                    aging: {$first: "$aging"},
                    expiryDate: {$first: "$expiryDate"},
                    UOM: {$first: "$UOM"},
                    SOH: {$sum: "$IRQty"}
                }
            },
            {
                $project: {
                    _id: 0,
                    batchCardNo: 1,
                    batchCardDate: 1,
                    expiryDate: 1,
                    aging: 1,
                    UOM: 1,
                    SOH: 1
                }
            },
            {
                $sort: {
                    batchCardDate: 1
                }
            }
        ]);
        return res.success(batchInfo);
    } catch (error) {
        console.error("getBatchInfo Batch Card", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllBCInkSummary = asyncHandler(async (req, res) => {
    try {
        const {prodUnitConfig = null} = req.query;
        let project = getAllBCInkAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.APPROVED,
                    batchQty: {$gt: 0},
                    ...(!!prodUnitConfig && {prodUnitConfig: ObjectId(prodUnitConfig)})
                }
            },
            {
                $group: {
                    _id: "$item",
                    batchCardNo: {$last: "$batchCardNo"},
                    batchCard: {$last: "$_id"},
                    batchCardDate: {$last: "$batchCardDate"},
                    itemCode: {$last: "$itemCode"},
                    itemName: {$last: "$itemName"},
                    itemDescription: {$last: "$itemDescription"},
                    UOM: {$last: "$UOM"},
                    batchQty: {$sum: "$batchQty"},
                    batchCode: {$last: "$batchCode"},
                    prodUnitConfig: {$last: "$prodUnitConfig"},
                    inventoryZone: {$first: "$prodItemInfo.inwardTo"}
                }
            },
            {
                $lookup: {
                    from: "BatchCardEntry",
                    localField: "batchCard",
                    foreignField: "batchCard",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                inventoryZone: 1,
                                generateReport: 1,
                                checkoutStatus: "$generateReport.checkoutStatus"
                            }
                        }
                    ],
                    as: "batchCardEntry"
                }
            },
            {
                $unwind: {
                    path: "$batchCardEntry",
                    preserveNullAndEmptyArrays: true
                }
            }
        ];
        let rows = await BatchCardRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        console.error("getAllBCInkSummary", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
