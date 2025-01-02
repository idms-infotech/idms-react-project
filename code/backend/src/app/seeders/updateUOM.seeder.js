const {default: mongoose} = require("mongoose");
const UOMUnitMasterDisplayJson = require("../mocks/UOMUnitMasterDisplay.json");

exports.updateManyUOMUnit = async function () {
    try {
        for await (const ele of UOMUnitMasterDisplayJson) {
            await Promise.all([
                // RejectedQtyMgnt
                // mongoose.connection
                //     .collection("RejectedQtyMgnt")
                //     .updateMany({UOM: ele.label}, {$set: {UOM: ele.value}}),
                //   PurchaseOrder
                mongoose.connection.collection("PurchaseOrder").updateMany(
                    {"PODetails.UOM": ele.label},
                    {
                        $set: {
                            "PODetails.$[elem].UOM": ele.value,
                            "PODetails.$[elem].primaryUnit": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.UOM": ele.label}]
                    }
                ),
                mongoose.connection.collection("PurchaseOrder").updateMany(
                    {"PODetails.secondaryUnit": ele.label},
                    {
                        $set: {
                            "PODetails.$[elem].secondaryUnit": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.secondaryUnit": ele.label}]
                    }
                ),
                // /MRN
                mongoose.connection.collection("MRN").updateMany(
                    {"MRNDetails.UOM": ele.label},
                    {
                        $set: {
                            "MRNDetails.$[elem].UOM": ele.value,
                            "MRNDetails.$[elem].primaryUnit": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.UOM": ele.label}]
                    }
                ),
                mongoose.connection.collection("MRN").updateMany(
                    {"MRNDetails.secondaryUnit": ele.label},
                    {
                        $set: {
                            "MRNDetails.$[elem].secondaryUnit": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.secondaryUnit": ele.label}]
                    }
                ),
                // SKUMaster
                mongoose.connection.collection("SKUMaster").updateMany(
                    {"materialInfo.UoM": ele.label},
                    {
                        $set: {
                            "materialInfo.$[elem].UoM": ele.value,
                            "materialInfo.$[elem].primaryUnit": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.UOM": ele.label}]
                    }
                ),
                mongoose.connection.collection("SKUMaster").updateMany(
                    {"materialInfo.secondaryUnit": ele.label},
                    {
                        $set: {
                            "materialInfo.$[elem].secondaryUnit": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.secondaryUnit": ele.label}]
                    }
                ),
                // GoodInwardEntry
                mongoose.connection.collection("GoodInwardEntry").updateMany(
                    {"GINDetails.UOM": ele.label},
                    {
                        $set: {
                            "GINDetails.$[elem].UOM": ele.value,
                            "GINDetails.$[elem].primaryUnit": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.UOM": ele.label}]
                    }
                ),
                mongoose.connection.collection("GoodInwardEntry").updateMany(
                    {"GINDetails.secondaryUnit": ele.label},
                    {
                        $set: {
                            "GINDetails.$[elem].secondaryUnit": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.secondaryUnit": ele.label}]
                    }
                ),
                // NPDMaster
                mongoose.connection.collection("NPDMaster").updateMany(
                    {"materialInfo.UoM": ele.label},
                    {
                        $set: {
                            "materialInfo.$[elem].UoM": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.UoM": ele.label}]
                    }
                ),
                // BoMOfSKU
                mongoose.connection.collection("BoMOfSKU").updateMany(
                    {"BOMOfSKUDetails.UOM": ele.label},
                    {
                        $set: {
                            "BOMOfSKUDetails.$[elem].UOM": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.UOM": ele.label}]
                    }
                ),
                // GoodsTransferRequest
                mongoose.connection.collection("GoodsTransferRequest").updateMany(
                    {"GTRequestDetails.UOM": ele.label},
                    {
                        $set: {
                            "GTRequestDetails.$[elem].UOM": ele.value,
                            "GTRequestDetails.$[elem].primaryUnit": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.UOM": ele.label}]
                    }
                ),
                mongoose.connection.collection("GoodsTransferRequest").updateMany(
                    {"GTRequestDetails.secondaryUnit": ele.label},
                    {
                        $set: {
                            "GTRequestDetails.$[elem].secondaryUnit": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.secondaryUnit": ele.label}]
                    }
                ),
                // GoodsRequisition
                mongoose.connection.collection("GoodsRequisition").updateMany(
                    {"GRDetails.primaryUnit": ele.label},
                    {
                        $set: {
                            "GRDetails.$[elem].primaryUnit": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.primaryUnit": ele.label}]
                    }
                ),
                // InkMaster
                mongoose.connection.collection("InkMaster").updateMany(
                    {UoM: ele.label},
                    {
                        $set: {
                            UoM: ele.value,
                            primaryUnit: ele.value
                        }
                    }
                ),
                mongoose.connection.collection("InkMaster").updateMany(
                    {secondaryUnit: ele.label},
                    {
                        $set: {
                            secondaryUnit: ele.value
                        }
                    }
                ),
                mongoose.connection.collection("InkMaster").updateMany(
                    {"inkMasterDetails.UoM": ele.label},
                    {
                        $set: {
                            "inkMasterDetails.$[elem].UoM": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.UoM": ele.label}]
                    }
                ),
                // InkMixing
                mongoose.connection.collection("InkMixing").updateMany(
                    {"inkMixingDetails.UOM": ele.label},
                    {
                        $set: {
                            "inkMixingDetails.$[elem].UOM": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.UOM": ele.label}]
                    }
                ),
                // PurchaseIndent
                mongoose.connection.collection("PurchaseIndent").updateMany(
                    {"indentDetails.UOM": ele.label},
                    {
                        $set: {
                            "indentDetails.$[elem].UOM": ele.value,
                            "indentDetails.$[elem].primaryUnit": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.UOM": ele.label}]
                    }
                ),
                mongoose.connection.collection("PurchaseIndent").updateMany(
                    {"indentDetails.secondaryUnit": ele.label},
                    {
                        $set: {
                            "indentDetails.$[elem].secondaryUnit": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.secondaryUnit": ele.label}]
                    }
                ),
                // GoodsIssue
                mongoose.connection.collection("GoodsIssue").updateMany(
                    {"GIDetails.UOM": ele.label},
                    {
                        $set: {
                            "GIDetails.$[elem].UOM": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.UOM": ele.label}]
                    }
                ),
                // GRN
                mongoose.connection.collection("GRN").updateMany(
                    {"GRNDetails.UOM": ele.label},
                    {
                        $set: {
                            "GRNDetails.$[elem].UOM": ele.value,
                            "GRNDetails.$[elem].primaryUnit": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.UOM": ele.label}]
                    }
                ),
                mongoose.connection.collection("GRN").updateMany(
                    {"GRNDetails.secondaryUnit": ele.label},
                    {
                        $set: {
                            "GRNDetails.$[elem].secondaryUnit": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.secondaryUnit": ele.label}]
                    }
                ),
                // InventoryCorrection
                mongoose.connection.collection("InventoryCorrection").updateMany(
                    {UOM: ele.label},
                    {
                        $set: {
                            UOM: ele.value,
                            primaryUnit: ele.value
                        }
                    }
                ),
                mongoose.connection.collection("InventoryCorrection").updateMany(
                    {secondaryUnit: ele.label},
                    {
                        $set: {
                            secondaryUnit: ele.value
                        }
                    }
                ),
                // BoMOfDSKU
                mongoose.connection.collection("BoMOfDSKU").updateMany(
                    {"BOMOfSKUDetails.UOM": ele.label},
                    {
                        $set: {
                            "BOMOfSKUDetails.$[elem].UOM": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.UOM": ele.label}]
                    }
                ),
                // GoodsIssuePPICToProduction
                mongoose.connection.collection("GoodsIssuePPICToProduction").updateMany(
                    {"MRNDetails.UOM": ele.label},
                    {
                        $set: {
                            "MRNDetails.$[elem].UOM": ele.value,
                            "MRNDetails.$[elem].primaryUnit": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.UOM": ele.label}]
                    }
                ),
                mongoose.connection.collection("GoodsIssuePPICToProduction").updateMany(
                    {"MRNDetails.secondaryUnit": ele.label},
                    {
                        $set: {
                            "MRNDetails.$[elem].secondaryUnit": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.secondaryUnit": ele.label}]
                    }
                ),
                // ProductionItem
                mongoose.connection.collection("ProductionItem").updateMany(
                    {secondaryUnit: ele.label},
                    {
                        $set: {
                            secondaryUnit: ele.value
                        }
                    }
                ),
                mongoose.connection.collection("ProductionItem").updateMany(
                    {primaryUnit: ele.label},
                    {
                        $set: {
                            primaryUnit: ele.value,
                            unitOfMeasurement: ele.value
                        }
                    }
                ),
                // SFGStock
                mongoose.connection.collection("SFGStock").updateMany(
                    {UOM: ele.label},
                    {
                        $set: {
                            UOM: ele.value
                        }
                    }
                ),
                // BOMOfProdItem
                mongoose.connection.collection("BOMOfProdItem").updateMany(
                    {"BOMOfProdItemDetails.UOM": ele.label},
                    {
                        $set: {
                            "BOMOfProdItemDetails.$[elem].UOM": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.UOM": ele.label}]
                    }
                ),
                // BOMOfGrandChildItem
                mongoose.connection.collection("BOMOfGrandChildItem").updateMany(
                    {"BOMOfGrandChildItemDetails.UOM": ele.label},
                    {
                        $set: {
                            "BOMOfGrandChildItemDetails.$[elem].UOM": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.UOM": ele.label}]
                    }
                ),
                // BoMOfProduct
                mongoose.connection.collection("BoMOfProduct").updateMany(
                    {"BoMOfProductDetails.UOM": ele.label},
                    {
                        $set: {
                            "BoMOfProductDetails.$[elem].UOM": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.UOM": ele.label}]
                    }
                ),
                //    ChildPartProduction
                mongoose.connection.collection("ChildPartProduction").updateMany(
                    {"childPartProductionDetails.UOM": ele.label},
                    {
                        $set: {
                            "childPartProductionDetails.$[elem].UOM": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.UOM": ele.label}]
                    }
                ),
                // GrandPartProduction
                mongoose.connection.collection("GrandPartProduction").updateMany(
                    {"groupPartProductionDetails.UOM": ele.label},
                    {
                        $set: {
                            "groupPartProductionDetails.$[elem].UOM": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.UOM": ele.label}]
                    }
                ),
                //    Items
                mongoose.connection.collection("Items").updateMany(
                    {orderInfoUOM: ele.label},
                    {
                        $set: {
                            orderInfoUOM: ele.value,
                            primaryUnit: ele.value
                        }
                    }
                ),
                mongoose.connection.collection("Items").updateMany(
                    {secondaryUnit: ele.label},
                    {
                        $set: {
                            secondaryUnit: ele.value
                        }
                    }
                ),
                mongoose.connection.collection("Items").updateMany(
                    {"supplierDetails.uom1": ele.label},
                    {
                        $set: {
                            "supplierDetails.$[elem].uom1": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.uom1": ele.label}]
                    }
                ),
                mongoose.connection.collection("Items").updateMany(
                    {"supplierDetails.uom2": ele.label},
                    {
                        $set: {
                            "supplierDetails.$[elem].uom2": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.uom2": ele.label}]
                    }
                ),
                mongoose.connection.collection("Items").updateMany(
                    {"channelDetails.uom1": ele.label},
                    {
                        $set: {
                            "channelDetails.$[elem].uom1": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.uom1": ele.label}]
                    }
                ),
                mongoose.connection.collection("Items").updateMany(
                    {"channelDetails.uom2": ele.label},
                    {
                        $set: {
                            "channelDetails.$[elem].uom2": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.uom2": ele.label}]
                    }
                )
            ]);
        }

        console.info("UOM Master Updated successfully!!");
    } catch (error) {
        throw new Error(error);
    }
};
