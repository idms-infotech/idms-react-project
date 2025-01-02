const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllStockPreparationAttributes} = require("../../../../models/planning/helpers/stockPreparationHelper");
const StockPreparationRepository = require("../../../../models/planning/repository/stockPreparationRepository");
const {filteredBoMOfSKUList} = require("../../../../models/planning/repository/BOMRepository/BoMOfSKURepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const InventoryRepository = require("../../../../models/stores/repository/inventoryCorrectionRepository");
const {setConversion} = require("../../../../helpers/utility");
const {GOODS_TRANSFER_REQUEST_DEPT, STOCK_PREP_UOM, INV_FORM_TYPE} = require("../../../../mocks/constantData");
const {getAllCheckedItemCategoriesList} = require("../../purchase/itemCategoryMaster/itemCategoryMaster");
const {OPTIONS} = require("../../../../helpers/global.options");
const {filteredSKUMasterList} = require("../../../../models/sales/repository/SKUMasterRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllStockPreparationAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await StockPreparationRepository.getAllPaginate({
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
exports.checkInventoryRecords = asyncHandler(async (req, res) => {
    try {
        let inventoryItems = await InventoryRepository.filteredInventoryCorrectionList([
            {
                $match: {
                    item: ObjectId(req.query.item),
                    department: GOODS_TRANSFER_REQUEST_DEPT.PLANNING,
                    closedIRQty: {$gt: 0},
                    UOM: {$in: STOCK_PREP_UOM.getStockUOM()}
                }
            },
            {
                $addFields: {
                    convertedClosedIRQty: {
                        $cond: [
                            {$eq: [STOCK_PREP_UOM.SQM, "$UOM"]},
                            "$closedIRQty",
                            {
                                $cond: [
                                    {$ne: ["$primaryToSecondaryConversion", null]},
                                    {
                                        $multiply: ["$closedIRQty", "$primaryToSecondaryConversion"]
                                    },
                                    {
                                        $divide: ["$closedIRQty", "$secondaryToPrimaryConversion"]
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
                    closedIRQty: {$sum: "$convertedClosedIRQty"}
                }
            },
            {
                $project: {
                    _id: 0,
                    closedIRQty: {$round: ["$closedIRQty", 2]}
                }
            }
        ]);
        return res.success({inventoryItemsAmount: inventoryItems.length ? inventoryItems[0]?.closedIRQty : null});
    } catch (e) {
        console.error("checkInventoryRecords", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.createOrUpdate = asyncHandler(async (req, res) => {
    try {
        let existing = await StockPreparationRepository.findOneDoc({
            jobCard: req.body.jobCard,
            SKU: req.body.SKU
        });
        if (existing) {
            existing.updatedBy = req.user.sub;
            req.body.stockPreparationDetails = req.body.stockPreparationDetails.map(x => {
                x.GTQty = +x.addOnGTQty + +x.GTQty;
                return x;
            });
            existing = await StockPreparationRepository.updateDoc(existing, req.body);
            if (existing) {
                await updateInvOnStockCutting(existing);
            }
        } else {
            let createdObj = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                ...req.body
            };
            delete createdObj._id;
            const itemDetails = await StockPreparationRepository.createDoc(createdObj);
            if (itemDetails) {
                await updateInvOnStockCutting(itemDetails);
            }
        }
        res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("Stock Cutting Log")
        });
    } catch (e) {
        console.error("create Stock Cutting Log", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const updateInvOnStockCutting = async itemDetails => {
    try {
        let stockPreparationDetails = itemDetails.stockPreparationDetails;
        let stockPrepId = itemDetails._id;
        for await (const stock of stockPreparationDetails) {
            if (!stock.isSaved) {
                continue;
            }
            let inventoryItems = await InventoryRepository.filteredInventoryCorrectionList([
                {
                    $match: {
                        item: ObjectId(stock.item),
                        department: GOODS_TRANSFER_REQUEST_DEPT.PLANNING,
                        closedIRQty: {$gt: 0},
                        UOM: {$in: STOCK_PREP_UOM.getStockUOM()}
                    }
                },
                {
                    $sort: {createdAt: 1}
                },
                {
                    $project: {
                        _id: 1
                    }
                }
            ]);

            let transferQty = stock.addOnGTQty ? stock.addOnGTQty : stock.GTQty;
            let inventoryHistory = [];
            let stockUOMConvertData = {
                UOM: STOCK_PREP_UOM.SQM,
                quantity: stock.GTQty,
                primaryUnit: stock.primaryUnit,
                secondaryUnit: stock.secondaryUnit,
                primaryToSecondaryConversion: stock.primaryToSecondaryConversion,
                secondaryToPrimaryConversion: stock.secondaryToPrimaryConversion
            };
            console.log("stockUOMConvertData", stockUOMConvertData);
            console.log("stock.UOM != STOCK_PREP_UOM.SQM", stock.UOM, STOCK_PREP_UOM.SQM);
            if (stock.UOM != STOCK_PREP_UOM.SQM) {
                transferQty = setConversion(stockUOMConvertData);
            }
            console.log("transferQty", transferQty);
            if (inventoryItems.length > 0) {
                for (const inv of inventoryItems) {
                    console.log("inv=========", inv);
                    let inventoryData = await InventoryRepository.getDocById(inv._id);
                    const SKUMaterialInfo = await filteredSKUMasterList([
                        {
                            $match: {
                                _id: ObjectId(itemDetails.SKU)
                            }
                        },
                        {
                            $unwind: "$materialInfo"
                        },
                        {
                            $match: {
                                "materialInfo.item": ObjectId(stock.item)
                            }
                        },
                        {
                            $project: {
                                itemDescription: "$materialInfo.itemDescription",
                                primaryUnit: "$materialInfo.primaryUnit",
                                secondaryUnit: "$materialInfo.secondaryUnit",
                                width: "$materialInfo.width",
                                length: "$materialInfo.length",
                                primaryToSecondaryConversion: "$materialInfo.primaryToSecondaryConversion",
                                secondaryToPrimaryConversion: "$materialInfo.secondaryToPrimaryConversion",
                                conversionOfUnits: "$materialInfo.conversionOfUnits"
                            }
                        }
                    ]);
                    let invCreateObj = JSON.parse(JSON.stringify(inventoryData));
                    delete invCreateObj._id;
                    invCreateObj.department = GOODS_TRANSFER_REQUEST_DEPT.PRODUCTION;
                    invCreateObj.formType = INV_FORM_TYPE.CHILD;
                    invCreateObj.UOM = inventoryData.UOM == STOCK_PREP_UOM.SQM ? STOCK_PREP_UOM.SQM : inventoryData.UOM;
                    console.log("SKUMaterialInfo", SKUMaterialInfo);
                    if (SKUMaterialInfo.length) {
                        invCreateObj.itemDescription = SKUMaterialInfo[0]?.itemDescription;
                        invCreateObj.primaryUnit = SKUMaterialInfo[0]?.primaryUnit;
                        invCreateObj.secondaryUnit = SKUMaterialInfo[0]?.secondaryUnit;
                        invCreateObj.width = SKUMaterialInfo[0]?.width;
                        invCreateObj.length = SKUMaterialInfo[0]?.length;
                        invCreateObj.primaryToSecondaryConversion = SKUMaterialInfo[0]?.primaryToSecondaryConversion;
                        invCreateObj.secondaryToPrimaryConversion = SKUMaterialInfo[0]?.secondaryToPrimaryConversion;
                        invCreateObj.conversionOfUnits = SKUMaterialInfo[0]?.conversionOfUnits;
                    }

                    console.log("invCreateObj", invCreateObj);

                    let invUOMConvertData = {
                        UOM: STOCK_PREP_UOM.SQM,
                        quantity: inventoryData.closedIRQty,
                        primaryUnit: inventoryData.primaryUnit,
                        secondaryUnit: inventoryData.secondaryUnit,
                        primaryToSecondaryConversion: inventoryData.primaryToSecondaryConversion,
                        secondaryToPrimaryConversion: inventoryData.secondaryToPrimaryConversion
                    };
                    console.log("invUOMConvertData", invUOMConvertData);
                    console.log("inventoryData.UOM != STOCK_PREP_UOM.SQM", inventoryData.UOM, STOCK_PREP_UOM.SQM);

                    if (inventoryData.UOM != STOCK_PREP_UOM.SQM) {
                        inventoryData.closedIRQty = setConversion(invUOMConvertData);
                    }
                    console.log("  inventoryData.closedIRQty", inventoryData.closedIRQty);
                    if (transferQty > inventoryData.closedIRQty) {
                        console.log("transferQty > inventoryData.closedIRQty", transferQty, inventoryData.closedIRQty);
                        inventoryHistory.push({
                            inventory: inv._id,
                            transferQty: inventoryData.closedIRQty
                        });
                        transferQty = transferQty - inventoryData.closedIRQty;
                        let invUOMConvertData = {
                            UOM: inventoryData.UOM,
                            quantity: inventoryData.closedIRQty,
                            primaryUnit: invCreateObj.primaryUnit,
                            secondaryUnit: invCreateObj.secondaryUnit,
                            primaryToSecondaryConversion: invCreateObj.primaryToSecondaryConversion,
                            secondaryToPrimaryConversion: invCreateObj.secondaryToPrimaryConversion
                        };
                        console.log("invUOMConvertData", invUOMConvertData);
                        if (inventoryData.UOM != STOCK_PREP_UOM.SQM) {
                            inventoryData.closedIRQty = setConversion(invUOMConvertData);
                        }
                        invCreateObj.closedIRQty = inventoryData.closedIRQty;

                        console.log("transferQty", transferQty);
                        inventoryData.closedIRQty = 0;
                    } else {
                        console.log("transferQty > inventoryData.closedIRQty", transferQty, inventoryData.closedIRQty);
                        inventoryHistory.push({
                            inventory: inv._id,
                            transferQty: transferQty
                        });
                        inventoryData.closedIRQty = inventoryData.closedIRQty - transferQty;
                        // old records
                        let oldInvUOMConvertData = {
                            UOM: inventoryData.UOM,
                            quantity: inventoryData.closedIRQty,
                            primaryUnit: inventoryData.primaryUnit,
                            secondaryUnit: inventoryData.secondaryUnit,
                            primaryToSecondaryConversion: inventoryData.primaryToSecondaryConversion,
                            secondaryToPrimaryConversion: inventoryData.secondaryToPrimaryConversion
                        };
                        console.log("oldInvUOMConvertData", oldInvUOMConvertData);
                        if (inventoryData.UOM != STOCK_PREP_UOM.SQM) {
                            inventoryData.closedIRQty = setConversion(oldInvUOMConvertData);
                        }
                        // new records
                        console.log(" inventoryData.closedIRQty", inventoryData.closedIRQty);
                        let invUOMConvertData = {
                            UOM: inventoryData.UOM,
                            quantity: transferQty,
                            primaryUnit: invCreateObj.primaryUnit,
                            secondaryUnit: invCreateObj.secondaryUnit,
                            primaryToSecondaryConversion: invCreateObj.primaryToSecondaryConversion,
                            secondaryToPrimaryConversion: invCreateObj.secondaryToPrimaryConversion
                        };
                        console.log("invUOMConvertData", invUOMConvertData);
                        invCreateObj.closedIRQty = transferQty;
                        if (inventoryData.UOM != STOCK_PREP_UOM.SQM) {
                            invCreateObj.closedIRQty = setConversion(invUOMConvertData);
                        }
                        transferQty = 0;
                        console.log("inventoryData.closedIRQty", inventoryData.closedIRQty);
                    }
                    await InventoryRepository.createDoc(invCreateObj);
                    console.log("inventoryData", inventoryData);

                    console.log("inventoryHistory", inventoryHistory);
                    await inventoryData.save();
                    if (transferQty == 0) {
                        console.log("inventoryHistory==============", inventoryHistory);
                        await StockPreparationRepository.findAndUpdateDoc(
                            {
                                _id: stockPrepId,
                                stockPreparationDetails: {
                                    $elemMatch: {item: stock.item}
                                }
                            },
                            {"stockPreparationDetails.$.inventoryHistory": inventoryHistory}
                        );
                        break;
                    }
                }
            }
        }
    } catch (error) {
        console.error("error", error);
    }
};
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let itemCategoriesList = await getAllCheckedItemCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            stockPreparation: true
        });
        itemCategoriesList = itemCategoriesList.map(x => x.category);
        let stockCuttingData = {};
        stockCuttingData = await StockPreparationRepository.findOneDoc({
            jobCard: ObjectId(req.query.jobCard),
            SKU: ObjectId(req.query.SKU)
        });
        if (!stockCuttingData) {
            let BOMOfSKUData = await filteredBoMOfSKUList([
                {
                    $match: {
                        SKU: ObjectId(req.query.SKU)
                    }
                },
                {
                    $sort: {SKUCode: 1}
                },
                {
                    $addFields: {
                        BOMOfSKUDetails: {
                            $filter: {
                                input: "$BOMOfSKUDetails",
                                as: "details",
                                cond: {$eq: ["$$details.referenceModel", "Items"]}
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: "Items",
                        localField: "BOMOfSKUDetails.reference",
                        foreignField: "_id",
                        pipeline: [
                            {
                                $project: {
                                    itemType: 1
                                }
                            }
                        ],
                        as: "item"
                    }
                },
                {
                    $match: {
                        ...(itemCategoriesList.length > 0 && {"item.itemType": {$in: itemCategoriesList}})
                    }
                },
                {
                    $project: {
                        jobCard: req.query.jobCard,
                        jobCardNo: req.query.jobCardNo,
                        SKU: "$SKU",
                        SKUNo: "$SKUCode",
                        SKUName: 1,
                        SKUDescription: 1,
                        UOM: "$UOM",
                        SKUBatchQty: req.query.batchQty,
                        stockPreparationDetails: {
                            $map: {
                                input: "$BOMOfSKUDetails",
                                as: "detail",
                                in: {
                                    select: {$literal: false},
                                    item: "$$detail.reference",
                                    itemCode: "$$detail.itemCode",
                                    itemName: "$$detail.itemName",
                                    itemDescription: "$$detail.itemDescription",
                                    UOM: "$$detail.UOM",
                                    primaryUnit: "$$detail.primaryUnit",
                                    secondaryUnit: "$$detail.secondaryUnit",
                                    conversionOfUnits: "$$detail.conversionOfUnits",
                                    primaryToSecondaryConversion: "$$detail.primaryToSecondaryConversion",
                                    secondaryToPrimaryConversion: "$$detail.secondaryToPrimaryConversion",
                                    MRPQty: {
                                        $divide: [
                                            {$multiply: ["$$detail.partCount", +req.query.batchQty]},
                                            "$partCount"
                                        ]
                                    },
                                    logEntry: {
                                        prodSource: {$literal: null},
                                        prodDate: {$literal: null},
                                        prodShift: {$literal: null},
                                        operatingStaff: {$literal: null},
                                        remarks: {$literal: null},
                                        authorizedBy: {$literal: null}
                                    },
                                    GTQty: {$literal: 0}
                                }
                            }
                        }
                    }
                }
            ]);
            stockCuttingData = BOMOfSKUData.length ? BOMOfSKUData[0] : {};
        }
        const shiftOptions = await getAllModuleMaster(req.user.company, "PRODUCTION_SHIFT");
        return res.success({stockCutting: stockCuttingData, shiftOptions});
    } catch (error) {
        console.error("getAllMasterData Stock Preparation", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
