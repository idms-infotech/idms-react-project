const {default: mongoose} = require("mongoose");
const {getIncrementNumWithPrefix} = require("../../../../helpers/utility");
const ItemRepository = require("../../../../models/purchase/repository/itemRepository");
const {getAllItemCategory, setItemsNextAutoIncrementNo} = require("../itemCategoryMaster/itemCategoryMaster");
const {ITEM_JSON, ITEM_CATEGORY_JSON} = require("./constantFile");
const {SALES_CATEGORY} = require("../../../../mocks/constantData");
const {ObjectId} = require("../../../../../config/mongoose");

const bulkMigrateItems = async () => {
    try {
        let itemsJson = ITEM_JSON;
        let list = await ItemRepository.filteredItemList([
            {
                $project: {
                    _id: 1,
                    itemCode: 1,
                    company: 1,
                    itemType: 1
                }
            }
        ]);
        let missingItems = [];
        let missingCat = [];
        for await (const ele of list) {
            let newCategory = itemsJson.find(x => ele.itemCode == x["Item Code"]);
            if (!newCategory) {
                missingItems.push(ele.itemCode);
                continue;
            }
            ele.itemType = newCategory["New Category"];
            const itemCategoryList = await getAllItemCategory(ele.company);
            let category = itemCategoryList.find(x => ele.itemType == x.category);
            if (!!category) {
                ele.itemCode = getIncrementNumWithPrefix({
                    modulePrefix: category.prefix,
                    autoIncrementValue: category.nextAutoIncrement,
                    digit: category.digit
                });
                // await setItemsNextAutoIncrementNo(ele.itemType);
            } else {
                missingCat.push(ele.itemType);
            }
            console.log("ele.itemCode", ele.itemCode);
            // await ItemRepository.findAndUpdateDoc({_id: ele._id}, [
            //     {
            //         $set: {itemCode: ele.itemCode, itemType: ele.itemType}
            //     }
            // ]);
        }
        console.log("missingItems", JSON.stringify(missingItems));
        console.log("missingCat", JSON.stringify(missingCat));
        console.log("ItemsCode And Category Updated");
    } catch (error) {
        console.error("error", error);
    }
};

// bulkMigrateItems().then(console.log("Items"));
const bulkMigrateItemsForPuneMeta = async () => {
    try {
        let list = await ItemRepository.filteredItemList([
            {
                $match: {
                    itemType: "INA - Inks and Additives",
                    orderInfoUOM: {$in: ["KGS", "LTR", "GMS"]}
                }
            },
            {
                $project: {
                    _id: 1,
                    itemCode: 1,
                    orderInfoUOM: 1,
                    primaryUnit: 1,
                    secondaryUnit: 1,
                    conversionOfUnits: 1,
                    supplierDetails: 1,
                    secondaryToPrimaryConversion: 1,
                    primaryToSecondaryConversion: 1
                }
            }
        ]);
        for await (const ele of list) {
            let existingItem = await ItemRepository.getDocById(ele._id, {
                orderInfoUOM: 1,
                primaryUnit: 1,
                secondaryUnit: 1,
                conversionOfUnits: 1,
                primaryToSecondaryConversion: 1,
                secondaryToPrimaryConversion: 1,
                supplierDetails: 1
            });
            const UOM_FOR_CONVERSION = ["KGS", "LTR"];
            for (const u of UOM_FOR_CONVERSION) {
                if (existingItem.orderInfoUOM == u) {
                    existingItem.primaryUnit = u;
                    existingItem.secondaryUnit = "GMS";
                    existingItem.conversionOfUnits = `1 ${u} = 1000 GMS`;
                    existingItem.primaryToSecondaryConversion = 1000;
                    existingItem.secondaryToPrimaryConversion = null;
                    existingItem.supplierDetails.forEach(x => {
                        x.purchaseRateCommon.forEach(y => {
                            y.unit1 = u;
                            y.unit2 = "GMS";
                            y.MOQ2 = existingItem.primaryToSecondaryConversion * y.MOQ1;
                            y.rate2 = y.rate1 / existingItem.primaryToSecondaryConversion;
                        });
                    });
                }
            }
            await existingItem.save();
        }
        console.log("Item UOM and Rate Updated");
    } catch (error) {
        console.error("error", error);
    }
};

// bulkMigrateItemsForPuneMeta().then(console.log("Items"));
const bulkMigrateItemsByCategory = async () => {
    try {
        let missingCat = [];
        let itemsList = await ItemRepository.filteredItemList([
            {
                $project: {
                    _id: 1,
                    itemCode: 1,
                    company: 1,
                    itemType: 1
                }
            }
        ]);
        const categoryMap = new Map(ITEM_CATEGORY_JSON.map(z => [z.ItemCategory, z.newItemCategory]));
        for await (const ele of itemsList) {
            if (!categoryMap.get(ele.itemType)) missingCat.push(ele.itemType);
            ele.itemType = categoryMap.get(ele.itemType);
            let categoryList = await getAllItemCategory(ele.company);
            if (categoryList?.length) {
                let category = categoryList.find(x => ele.itemType == x.category);
                if (!!category) {
                    ele.itemCode = getIncrementNumWithPrefix({
                        modulePrefix: category.prefix,
                        autoIncrementValue: category.nextAutoIncrement,
                        digit: category.digit
                    });
                }
                await setItemsNextAutoIncrementNo(ele.itemType);
            }
            // console.log("ele.itemCode", ele.itemCode);
            let output = await ItemRepository.findAndUpdateDoc(
                {_id: ele._id},
                {
                    itemCode: ele.itemCode,
                    itemType: ele.itemType
                }
            );
            console.log("output", output);
        }
        console.log("missingCat", missingCat);
        console.log("Items Prefix Updated  Updated");
    } catch (error) {
        console.error("error", error);
    }
};
// bulkMigrateItemsByCategory().then(console.log("Items_Category"));
const updateItemCodeBulk = async () => {
    try {
        const Item = mongoose.model("Items");
        let itemsList = await Item.find(
            {},
            {
                _id: 0,
                value: "$itemCode",
                label: "$_id"
            }
        ).lean();
        // console.log("itemsList", JSON.stringify(itemsList));
        // return;
        /** ---------------StockCutting -------------------------*/
        const StockCutting = mongoose.model("StockCutting");
        let stockCuttingList = await StockCutting.find({}, {stockCuttingDetails: 1, _id: 1});
        let itemsDataMap = new Map(itemsList.map(x => [x.label, x.value]));
        for (const s of stockCuttingList) {
            s.stockCuttingDetails = s.stockCuttingDetails.map(stock => {
                stock.itemCode = itemsDataMap.get(stock.reference);
                for (const opening of stock.PPICOpeningStock) {
                    opening.itemCode = itemsDataMap.get(opening.item);
                }
                for (const prodToGT of stock.PPICToProductionGT) {
                    prodToGT.itemCode = itemsDataMap.get(prodToGT.item);
                }
                for (const closingCal of stock.PPICClosingStockCalculated) {
                    closingCal.itemCode = itemsDataMap.get(closingCal.item);
                }
                for (const closingAct of stock.PPICClosingStockActual) {
                    closingAct.itemCode = itemsDataMap.get(closingAct.item);
                }
            });
            await s.save();
        }
        /** ---------------BOMOfJobWorkItem -------------------------*/
        let BOMOfJobWorkItemCount = await mongoose.connection.collection("BOMOfJobWorkItem").countDocuments();
        console.log("BOMOfJobWorkItemCount", BOMOfJobWorkItemCount);
        /** ---------------GoodsIssuePPICToProduction -------------------------*/
        let GoodsIssuePPICToProductionCount = await mongoose.connection
            .collection("GoodsIssuePPICToProduction")
            .countDocuments();
        console.log("GoodsIssuePPICToProductionCount", GoodsIssuePPICToProductionCount);
        /** ---------------GoodsTransferRequest -------------------------*/
        let GoodsTransferRequestCount = await mongoose.connection.collection("GoodsTransferRequest").countDocuments();
        console.log("GoodsTransferRequestCount", GoodsTransferRequestCount);
        /** ---------------StockIssueToProduction -------------------------*/
        let StockIssueToProductionCount = await mongoose.connection
            .collection("StockIssueToProduction")
            .countDocuments();
        console.log("StockIssueToProductionCount", StockIssueToProductionCount);

        /** ---------------StockPreparation -------------------------*/
        let StockPreparationCount = await mongoose.connection.collection("StockPreparation").countDocuments();
        console.log("StockPreparationCount", StockPreparationCount);

        /** ---------------StockTransferToStores -------------------------*/
        let StockTransferToStoresCount = await mongoose.connection.collection("StockTransferToStores").countDocuments();
        console.log("StockTransferToStoresCount", StockTransferToStoresCount);

        /** ---------------BOMOfProdItem -------------------------*/
        let BOMOfChildPartCount = await mongoose.connection.collection("BOMOfProdItem").countDocuments();
        console.log("BOMOfChildPartCount", BOMOfChildPartCount);

        /** ---------------BOMOfGrandChildItem -------------------------*/
        let BOMOfGrandChildItemCount = await mongoose.connection.collection("BOMOfGrandChildItem").countDocuments();
        console.log("BOMOfGrandChildItemCount", BOMOfGrandChildItemCount);

        /** ---------------BoMOfProduct -------------------------*/
        let BoMOfProductCount = await mongoose.connection.collection("BoMOfProduct").countDocuments();
        console.log("BoMOfProductCount", BoMOfProductCount);

        /** ---------------BoMOfSKU -------------------------*/
        let BoMOfSKUCount = await mongoose.connection.collection("BoMOfSKU").countDocuments();
        console.log("BoMOfSKUCount", BoMOfSKUCount);

        /** ---------------InkMaster -------------------------*/
        let InkMasterCount = await mongoose.connection.collection("InkMaster").countDocuments();
        console.log("InkMasterCount", InkMasterCount);

        /** ---------------InkMixingLog -------------------------*/
        let InkMixingLogCount = await mongoose.connection.collection("InkMixingLog").countDocuments();
        console.log("InkMixingLogCount", InkMixingLogCount);

        /** ---------------InkMixing -------------------------*/
        let InkMixingCount = await mongoose.connection.collection("InkMixing").countDocuments();
        console.log("InkMixingCount", InkMixingCount);

        /** ---------------JobWorkChallan -------------------------*/
        let JobWorkChallanCount = await mongoose.connection.collection("JobWorkChallan").countDocuments();
        console.log("JobWorkChallanCount", JobWorkChallanCount);

        /** ---------------JobWorkOrder -------------------------*/
        let JobWorkOrderCount = await mongoose.connection.collection("JobWorkOrder").countDocuments();
        console.log("JobWorkOrderCount", JobWorkOrderCount);

        /** ---------------PurchaseIndent -------------------------*/
        let PurchaseIndentCount = await mongoose.connection.collection("PurchaseIndent").countDocuments();
        console.log("PurchaseIndentCount", PurchaseIndentCount);

        /** ---------------SKUMaster -------------------------*/
        let SKUMasterCount = await mongoose.connection.collection("SKUMaster").countDocuments();
        console.log("SKUMasterCount", SKUMasterCount);

        /** ---------------GoodsTransferResponse -------------------------*/
        let GoodsTransferResponseCount = await mongoose.connection.collection("GoodsTransferResponse").countDocuments();
        console.log("GoodsTransferResponseCount", GoodsTransferResponseCount);

        /** ---------------SFGStock -------------------------*/
        let SFGStockCount = await mongoose.connection.collection("SFGStock").countDocuments();
        console.log("SFGStockCount", SFGStockCount);

        /** ---------------InventoryCorrection -------------------------*/
        let InventoryCorrectionCount = await mongoose.connection.collection("InventoryCorrection").countDocuments();
        console.log("InventoryCorrectionCount", InventoryCorrectionCount);

        /** ---------------WIPInventory -------------------------*/
        let WIPInventoryCount = await mongoose.connection.collection("WIPInventory").countDocuments();
        console.log("WIPInventoryCount", WIPInventoryCount);
        for await (const ele of itemsList) {
            console.log("ele", ele);
            /** ---------------BOMOfJobWorkItem -------------------------*/
            if (BOMOfJobWorkItemCount > 0) {
                let output = await mongoose.connection.collection("BOMOfJobWorkItem").updateMany(
                    {"BOMOfJobWorkItemInfo.item": ele.label},
                    {
                        $set: {
                            "BOMOfJobWorkItemInfo.$[elem].itemCode": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.item": ele.label}]
                    }
                );
                console.log("BOMOfJobWorkItem output", output);
            }
            /** ---------------GoodsIssuePPICToProduction -------------------------*/
            if (GoodsIssuePPICToProductionCount > 0) {
                let output = await mongoose.connection.collection("GoodsIssuePPICToProduction").updateMany(
                    {"MRNDetails.item": ele.label},
                    {
                        $set: {
                            "MRNDetails.$[elem].itemCode": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.item": ele.label}]
                    }
                );
                console.log("GoodsIssuePPICToProduction output", output);
            }
            /** ---------------GoodsTransferRequest -------------------------*/
            if (GoodsTransferRequestCount > 0) {
                let output = await mongoose.connection.collection("GoodsTransferRequest").updateMany(
                    {"GTRequestDetails.item": ele.label},
                    {
                        $set: {
                            "GTRequestDetails.$[elem].itemCode": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.item": ele.label}]
                    }
                );
                console.log("GoodsTransferRequest output", output);
            }
            /** ---------------StockIssueToProduction -------------------------*/
            if (StockIssueToProductionCount > 0) {
                let output = await mongoose.connection.collection("StockIssueToProduction").updateMany(
                    {"stockIssueDetails.item": ele.label},
                    {
                        $set: {
                            "stockIssueDetails.$[elem].itemCode": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.item": ele.label}]
                    }
                );
                console.log("StockIssueToProduction output", output);
            }
            /** ---------------StockPreparation -------------------------*/
            if (StockPreparationCount > 0) {
                let output = await mongoose.connection.collection("StockPreparation").updateMany(
                    {"stockPreparationDetails.item": ele.label},
                    {
                        $set: {
                            "stockPreparationDetails.$[elem].itemCode": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.item": ele.label}]
                    }
                );
                console.log("StockPreparation output", output);
            }
            /** ---------------StockTransferToStores -------------------------*/
            if (StockTransferToStoresCount > 0) {
                let output = await mongoose.connection.collection("StockTransferToStores").updateMany(
                    {"stockTransferDetails.item": ele.label},
                    {
                        $set: {
                            "stockTransferDetails.$[elem].itemCode": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.item": ele.label}]
                    }
                );
                console.log("output", output);
            }
            /** ---------------BOMOfChildPart -------------------------*/
            if (BOMOfChildPartCount > 0) {
                let output = await mongoose.connection.collection("BOMOfProdItem").updateMany(
                    {"BOMOfProdItemDetails.reference": ele.label},
                    {
                        $set: {
                            "BOMOfProdItemDetails.$[elem].itemCode": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.reference": ele.label}]
                    }
                );
                console.log("output", output);
            }
            /** ---------------BOMOfGrandChildItem -------------------------*/
            // if (BOMOfGrandProdItemCount > 0) {
            //     let output = await mongoose.connection.collection("BOMOfGrandChildItem").updateMany(
            //         {"BOMOfGrandChildItemDetails.reference": ele.label},
            //         {
            //             $set: {
            //                 "BOMOfGrandChildItemDetails.$[elem].itemCode": ele.value
            //             }
            //         },
            //         {
            //             arrayFilters: [{"elem.reference": ele.label}]
            //         }
            //     );
            //     console.log("output", output);
            // }
            /** ---------------BoMOfProduct -------------------------*/
            if (BoMOfProductCount > 0) {
                let output = await mongoose.connection.collection("BoMOfProduct").updateMany(
                    {"BoMOfProductDetails.reference": ele.label},
                    {
                        $set: {
                            "BoMOfProductDetails.$[elem].itemCode": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.reference": ele.label}]
                    }
                );
                console.log("BoMOfProduct output", output);
            }
            /** ---------------BoMOfSKU -------------------------*/
            if (BoMOfSKUCount > 0) {
                let output = await mongoose.connection.collection("BoMOfSKU").updateMany(
                    {"BOMOfSKUDetails.reference": ele.label},
                    {
                        $set: {
                            "BOMOfSKUDetails.$[elem].itemCode": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.reference": ele.label}]
                    }
                );
                console.log("BoMOfSKU output", output);
            }
            /** ---------------InkMaster -------------------------*/
            if (InkMasterCount > 0) {
                let output = await mongoose.connection.collection("InkMaster").updateMany(
                    {"inkMasterDetails.item": ele.label},
                    {
                        $set: {
                            "inkMasterDetails.$[elem].itemCode": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.item": ele.label}]
                    }
                );
                console.log("InkMaster output", output);
            }
            /** ---------------InkMixingLog -------------------------*/
            if (InkMixingLogCount > 0) {
                let output = await mongoose.connection.collection("InkMixingLog").updateMany(
                    {},
                    {
                        $set: {
                            "inkMixingLogDetails.$[elem].newBatch.$[batchElem].itemCode": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"batchElem.item": ele.label}, {"elem.newBatch": {$exists: true}}]
                    }
                );
                console.log("InkMixingLog output", output);
            }
            /** ---------------InkMixing -------------------------*/
            if (InkMixingCount > 0) {
                let output = await mongoose.connection.collection("InkMixing").updateMany(
                    {},
                    {
                        $set: {
                            "inkMixingDetails.$[elem].inkDetails.$[batchElem].itemCode": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"batchElem.item": ele.label}, {"elem.inkDetails": {$exists: true}}]
                    }
                );
                console.log("InkMixing output", output);
            }
            /** ---------------JobWorkChallan -------------------------*/
            if (JobWorkChallanCount > 0) {
                let output = await mongoose.connection.collection("JobWorkChallan").updateMany(
                    {"JWChallanDetails.item": ele.label},
                    {
                        $set: {
                            "JWChallanDetails.$[elem].itemCode": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.item": ele.label}]
                    }
                );
                console.log("JobWorkChallan output", output);
            }
            /** ---------------JobWorkOrder -------------------------*/
            if (JobWorkOrderCount > 0) {
                let output = await mongoose.connection.collection("JobWorkOrder").updateMany(
                    {"WODetails.jobWorkItem": ele.label},
                    {
                        $set: {
                            "WODetails.$[elem].jobWorkItemCode": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.jobWorkItem": ele.label}]
                    }
                );
                console.log("JobWorkOrder output", output);
            }
            /** ---------------PurchaseIndent -------------------------*/
            if (PurchaseIndentCount > 0) {
                let output = await mongoose.connection.collection("PurchaseIndent").updateMany(
                    {"indentDetails.item": ele.label},
                    {
                        $set: {
                            "indentDetails.$[elem].itemCode": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.item": ele.label}]
                    }
                );
                console.log("PurchaseIndent output", output);
            }
            /** ---------------SKUMaster -------------------------*/
            if (SKUMasterCount > 0) {
                let output = await mongoose.connection.collection("SKUMaster").updateMany(
                    {"materialInfo.item": ele.label},
                    {
                        $set: {
                            "materialInfo.$[elem].itemCode": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.item": ele.label}]
                    }
                );
                console.log("SKUMaster output", output);
            }
            /** ---------------GoodsTransferResponse -------------------------*/
            if (GoodsTransferResponseCount > 0) {
                let output = await mongoose.connection.collection("GoodsTransferResponse").updateMany(
                    {"GTDetails.item": ele.label},
                    {
                        $set: {
                            "GTDetails.$[elem].itemCode": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.item": ele.label}]
                    }
                );
                console.log("GoodsTransferResponse output", output);
            }
            /** ---------------SFGStock -------------------------*/
            if (SFGStockCount > 0) {
                let output = await mongoose.connection.collection("SFGStock").updateMany(
                    {item: ele.label},
                    {
                        $set: {
                            itemCode: ele.value
                        }
                    }
                );
                console.log("SFGStockCount output", output);
            }
            /** ---------------InventoryCorrection -------------------------*/
            if (InventoryCorrectionCount > 0) {
                let output = await mongoose.connection.collection("InventoryCorrection").updateMany(
                    {item: ele.label},
                    {
                        $set: {
                            itemCode: ele.value
                        }
                    }
                );
                console.log("InventoryCorrection output", output);
            }
            /** ---------------WIPInventory -------------------------*/
            if (WIPInventoryCount > 0) {
                let output = await mongoose.connection.collection("WIPInventory").updateMany(
                    {item: ele.label},
                    {
                        $set: {
                            itemCode: ele.value
                        }
                    }
                );
                console.log("WIPInventory output", output);
            }
        }
        console.log("Successfully item code saved");
    } catch (error) {
        console.error("error", error);
    }
};

// updateItemCodeBulk();
