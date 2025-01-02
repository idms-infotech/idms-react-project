const {default: mongoose} = require("mongoose");
const OLD_UNIT_JSON = [
    {
        label: "KG",
        value: "KGS"
    }
];
exports.updateUOMBulk = async () => {
    try {
        for (const ele of OLD_UNIT_JSON) {
            /** ---------------SalesInvoice -------------------------*/
            await mongoose.connection.collection("SalesInvoice").updateMany(
                {"salesInvoiceDetails.unit": ele.label},
                {
                    $set: {
                        "salesInvoiceDetails.$[elem].unit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.unit": ele.label}]
                }
            );
            /** ---------------SalesOrder -------------------------*/
            await mongoose.connection.collection("SalesOrder").updateMany(
                {"SODetails.UOM": ele.label},
                {
                    $set: {
                        "SODetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------SalesOrder -------------------------*/
            await mongoose.connection.collection("SalesOrder").updateMany(
                {"SODetails.primaryUnit": ele.label},
                {
                    $set: {
                        "SODetails.$[elem].primaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.primaryUnit": ele.label}]
                }
            );
            /** ---------------SalesOrder -------------------------*/
            await mongoose.connection.collection("SalesOrder").updateMany(
                {"SODetails.secondaryUnit": ele.label},
                {
                    $set: {
                        "SODetails.$[elem].secondaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.secondaryUnit": ele.label}]
                }
            );
            /** ---------------SalesOrder -------------------------*/
            await mongoose.connection.collection("SalesOrder").updateMany(
                {"SODetails.sellingRateCommon.unit1": ele.label},
                {
                    $set: {
                        "SODetails.$[].sellingRateCommon.$[elem].unit1": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.unit1": ele.label}]
                }
            );
            /** ---------------SalesOrder -------------------------*/
            await mongoose.connection.collection("SalesOrder").updateMany(
                {"SODetails.sellingRateCommon.unit2": ele.label},
                {
                    $set: {
                        "SODetails.$[].sellingRateCommon.$[elem].unit2": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.unit2": ele.label}]
                }
            );
            /** ---------------ProformaInvoice -------------------------*/
            await mongoose.connection.collection("ProformaInvoice").updateMany(
                {"PIDetails.UOM": ele.label},
                {
                    $set: {
                        "PIDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------ProformaInvoice -------------------------*/
            await mongoose.connection.collection("ProformaInvoice").updateMany(
                {"PIDetails.primaryUnit": ele.label},
                {
                    $set: {
                        "PIDetails.$[elem].primaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.primaryUnit": ele.label}]
                }
            );
            /** ---------------ProformaInvoice -------------------------*/
            await mongoose.connection.collection("ProformaInvoice").updateMany(
                {"PIDetails.secondaryUnit": ele.label},
                {
                    $set: {
                        "PIDetails.$[elem].secondaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.secondaryUnit": ele.label}]
                }
            );
            /** ---------------ProformaInvoice -------------------------*/
            await mongoose.connection.collection("ProformaInvoice").updateMany(
                {"PIDetails.sellingRateCommon.unit1": ele.label},
                {
                    $set: {
                        "PIDetails.$[].sellingRateCommon.$[elem].unit1": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.unit1": ele.label}]
                }
            );
            /** ---------------ProformaInvoice -------------------------*/
            await mongoose.connection.collection("ProformaInvoice").updateMany(
                {"PIDetails.sellingRateCommon.unit2": ele.label},
                {
                    $set: {
                        "PIDetails.$[].sellingRateCommon.$[elem].unit2": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.unit2": ele.label}]
                }
            );
            /** ---------------DispatchRequestNote -------------------------*/
            await mongoose.connection.collection("DispatchRequestNote").updateMany(
                {"DRNDetails.UOM": ele.label},
                {
                    $set: {
                        "DRNDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------AdvanceShipmentNotice -------------------------*/
            await mongoose.connection.collection("AdvanceShipmentNotice").updateMany(
                {"salesInvoiceDetails.unit": ele.label},
                {
                    $set: {
                        "salesInvoiceDetails.$[elem].unit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.unit": ele.label}]
                }
            );
            /** ---------------DirectTaxInvoice -------------------------*/
            await mongoose.connection.collection("DirectTaxInvoice").updateMany(
                {"salesInvoiceDetails.unit": ele.label},
                {
                    $set: {
                        "salesInvoiceDetails.$[elem].unit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.unit": ele.label}]
                }
            );
            /** ---------------SKUMaster -------------------------*/
            await mongoose.connection.collection("SKUMaster").updateMany(
                {primaryUnit: ele.label},
                {
                    $set: {
                        primaryUnit: ele.value
                    }
                }
            );
            /** ---------------SKUMaster -------------------------*/
            await mongoose.connection.collection("SKUMaster").updateMany(
                {secondaryUnit: ele.label},
                {
                    $set: {
                        secondaryUnit: ele.value
                    }
                }
            );
            /** ---------------SKUMaster -------------------------*/
            await mongoose.connection.collection("SKUMaster").updateMany(
                {"customerInfo.sellingRateCommon.unit1": ele.label},
                {
                    $set: {
                        "customerInfo.$[].sellingRateCommon.$[elem].unit1": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.unit1": ele.label}]
                }
            );
            /** ---------------SKUMaster -------------------------*/
            await mongoose.connection.collection("SKUMaster").updateMany(
                {"customerInfo.sellingRateCommon.unit2": ele.label},
                {
                    $set: {
                        "customerInfo.$[].sellingRateCommon.$[elem].unit2": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.unit2": ele.label}]
                }
            );
            /** ---------------SKUMaster -------------------------*/
            await mongoose.connection.collection("SKUMaster").updateMany(
                {"materialInfo.UoM": ele.label},
                {
                    $set: {
                        "materialInfo.$[elem].UoM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UoM": ele.label}]
                }
            );
            /** ---------------SKUMaster -------------------------*/
            await mongoose.connection.collection("SKUMaster").updateMany(
                {"specificationInfo.UOM": ele.label},
                {
                    $set: {
                        "specificationInfo.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------SKUMaster -------------------------*/
            await mongoose.connection.collection("SKUMaster").updateMany(
                {"inkDetails.UoM": ele.label},
                {
                    $set: {
                        "inkDetails.$[elem].UoM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UoM": ele.label}]
                }
            );
            /** ---------------SKUMaster -------------------------*/
            await mongoose.connection.collection("SKUMaster").updateMany(
                {"dimensionsDetails.actualDimensions.unit": ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /** ---------------SKUMaster -------------------------*/
            await mongoose.connection.collection("SKUMaster").updateMany(
                {"dimensionsDetails.layoutDimensions.unit": ele.label},
                {
                    $set: {
                        "dimensionsDetails.layoutDimensions.unit": ele.value
                    }
                }
            );
            /** ---------------SKUMaster -------------------------*/
            await mongoose.connection.collection("SKUMaster").updateMany(
                {"BOMDimensionInfo.unit1": ele.label},
                {
                    $set: {
                        "BOMDimensionInfo.unit1": ele.value
                    }
                }
            );
            /** ---------------BoMOfDSKU -------------------------*/
            await mongoose.connection.collection("BoMOfDSKU").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /** ---------------BoMOfDSKU -------------------------*/
            await mongoose.connection.collection("BoMOfDSKU").updateMany(
                {"BOMOfSKUDetails.UOM": ele.label},
                {
                    $set: {
                        "BOMOfSKUDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------SampleJCCreation -------------------------*/
            await mongoose.connection.collection("SampleJCCreation").updateMany(
                {"SKUDetails.UOM": ele.label},
                {
                    $set: {
                        "SKUDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );

            /** ---------------SampleJCCreation -------------------------*/
            await mongoose.connection.collection("SampleJCCreation").updateMany(
                {"SKUDetails.FGInventoryInfo.UOM": ele.label},
                {
                    $set: {
                        "SKUDetails.$[].FGInventoryInfo.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );

            /** ---------------DirectCostDSKU -------------------------*/
            await mongoose.connection.collection("DirectCostDSKU").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /** ---------------SampleJCEntry -------------------------*/
            await mongoose.connection.collection("SampleJCEntry").updateMany(
                {"JCEntryDetails.UOM": ele.label},
                {
                    $set: {
                        "JCEntryDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------SampleRequest -------------------------*/
            await mongoose.connection.collection("SampleRequest").updateMany(
                {"SRDetails.UOM": ele.label},
                {
                    $set: {
                        "SRDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );

            /** ---------------SampleJCEntry -------------------------*/
            await mongoose.connection.collection("SampleJCEntry").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );

            /** ---------------ShipmentPlanning -------------------------*/
            await mongoose.connection.collection("ShipmentPlanning").updateMany(
                {"SPDetails.UOM": ele.label},
                {
                    $set: {
                        "SPDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );

            /** ---------------BatchCard -------------------------*/
            await mongoose.connection.collection("BatchCard").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /** ---------------BillingOfMaterial -------------------------*/
            await mongoose.connection.collection("BillingOfMaterial").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /** ---------------BillingOfMaterial -------------------------*/
            await mongoose.connection.collection("BillingOfMaterial").updateMany(
                {"BOMComposition.UOM": ele.label},
                {
                    $set: {
                        "BOMComposition.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------BoMJP15 -------------------------*/
            await mongoose.connection.collection("BoMJP15").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /** ---------------BoMJP15 -------------------------*/
            await mongoose.connection.collection("BoMJP15").updateMany(
                {"BoMJP15Details.UOM": ele.label},
                {
                    $set: {
                        "BoMJP15Details.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------BOMOfJobWorkItem -------------------------*/
            await mongoose.connection.collection("BOMOfJobWorkItem").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /** ---------------BOMOfJobWorkItem -------------------------*/
            await mongoose.connection.collection("BOMOfJobWorkItem").updateMany(
                {"BOMOfJobWorkItemInfo.UOM": ele.label},
                {
                    $set: {
                        "BOMOfJobWorkItemInfo.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------BOMOfJobWorkItem -------------------------*/
            await mongoose.connection.collection("BOMOfJobWorkItem").updateMany(
                {"BOMOfJobWorkItemInfo.primaryUnit": ele.label},
                {
                    $set: {
                        "BOMOfJobWorkItemInfo.$[elem].primaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.primaryUnit": ele.label}]
                }
            );
            /** ---------------BOMOfJobWorkItem -------------------------*/
            await mongoose.connection.collection("BOMOfJobWorkItem").updateMany(
                {"BOMOfJobWorkItemInfo.conversionOfUnits": ele.label},
                {
                    $set: {
                        "BOMOfJobWorkItemInfo.$[elem].conversionOfUnits": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.conversionOfUnits": ele.label}]
                }
            );
            // /** ---------------GoodsIssuePPICToProduction -------------------------*/
            await mongoose.connection.collection("GoodsIssuePPICToProduction").updateMany(
                {"MRNDetails.UOM": ele.label},
                {
                    $set: {
                        "MRNDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------GoodsTransferRequest -------------------------*/
            await mongoose.connection.collection("GoodsTransferRequest").updateMany(
                {"GTRequestDetails.UOM": ele.label},
                {
                    $set: {
                        "GTRequestDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------GoodsTransferRequest -------------------------*/
            await mongoose.connection.collection("GoodsTransferRequest").updateMany(
                {"GTRequestDetails.primaryUnit": ele.label},
                {
                    $set: {
                        "GTRequestDetails.$[elem].primaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.primaryUnit": ele.label}]
                }
            );
            /** ---------------GoodsTransferRequest -------------------------*/
            await mongoose.connection.collection("GoodsTransferRequest").updateMany(
                {"GTRequestDetails.secondaryUnit": ele.label},
                {
                    $set: {
                        "GTRequestDetails.$[elem].secondaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.secondaryUnit": ele.label}]
                }
            );
            /** ---------------DirectCost -------------------------*/
            await mongoose.connection.collection("DirectCost").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /** ---------------JobCardCreation -------------------------*/
            await mongoose.connection.collection("JobCardCreation").updateMany(
                {"SKUDetails.UOM": ele.label},
                {
                    $set: {
                        "SKUDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------JobCardCreation -------------------------*/
            await mongoose.connection.collection("JobCardCreation").updateMany(
                {"DSKUDetails.UOM": ele.label},
                {
                    $set: {
                        "DSKUDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------JobCardCreation -------------------------*/
            await mongoose.connection.collection("JobCardCreation").updateMany(
                {"SKUDetails.FGInventoryInfo.UOM": ele.label},
                {
                    $set: {
                        "SKUDetails.$[].FGInventoryInfo.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------JobCardCreation -------------------------*/
            await mongoose.connection.collection("JobCardCreation").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /** ---------------JWIItemStdCost -------------------------*/
            await mongoose.connection.collection("JWIItemStdCost").updateMany(
                {"jobWorkerDetails.UOM": ele.label},
                {
                    $set: {
                        "jobWorkerDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------PlanningItemMaster -------------------------*/
            await mongoose.connection.collection("PlanningItemMaster").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /** ---------------PlanningItemMaster -------------------------*/
            await mongoose.connection.collection("PlanningItemMaster").updateMany(
                {"JWPrincipalDetails.UOM": ele.label},
                {
                    $set: {
                        "JWPrincipalDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------ProductionItem -------------------------*/
            await mongoose.connection.collection("ProductionItem").updateMany(
                {unitOfMeasurement: ele.label},
                {
                    $set: {
                        unitOfMeasurement: ele.value
                    }
                }
            );
            /** ---------------ProductionItem -------------------------*/
            await mongoose.connection.collection("ProductionItem").updateMany(
                {primaryUnit: ele.label},
                {
                    $set: {
                        primaryUnit: ele.value
                    }
                }
            );
            /** ---------------ProductionItem -------------------------*/
            await mongoose.connection.collection("ProductionItem").updateMany(
                {secondaryUnit: ele.label},
                {
                    $set: {
                        secondaryUnit: ele.value
                    }
                }
            );
            /** ---------------ProdItemStdCost -------------------------*/
            await mongoose.connection.collection("ProdItemStdCost").updateMany(
                {"prodUnitDetails.UOM": ele.label},
                {
                    $set: {
                        "prodUnitDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------ProdProcessFlow -------------------------*/
            await mongoose.connection.collection("ProdProcessFlow").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /** ---------------RoutingMaster -------------------------*/
            await mongoose.connection.collection("RoutingMaster").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /** ---------------SFGStock -------------------------*/
            await mongoose.connection.collection("SFGStock").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /** ---------------SKUCosting -------------------------*/
            await mongoose.connection.collection("SKUCosting").updateMany(
                {"BOMCostBreakdown.UOM": ele.label},
                {
                    $set: {
                        "BOMCostBreakdown.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------SKUCostSheet -------------------------*/
            await mongoose.connection.collection("SKUCostSheet").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /** ---------------SKUMasterJP15 -------------------------*/
            await mongoose.connection.collection("SKUMasterJP15").updateMany(
                {"JWPrincipalInfo.UOM": ele.label},
                {
                    $set: {
                        "JWPrincipalInfo.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------SKUMasterJP15 -------------------------*/
            await mongoose.connection.collection("SKUMasterJP15").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /** ---------------StockIssueToProduction -------------------------*/
            await mongoose.connection.collection("StockIssueToProduction").updateMany(
                {"stockIssueDetails.UOM": ele.label},
                {
                    $set: {
                        "stockIssueDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------StockPreparation -------------------------*/
            await mongoose.connection.collection("StockPreparation").updateMany(
                {"stockPreparationDetails.UOM": ele.label},
                {
                    $set: {
                        "stockPreparationDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------StockPreparation -------------------------*/
            await mongoose.connection.collection("StockPreparation").updateMany(
                {"stockPreparationDetails.primaryUnit": ele.label},
                {
                    $set: {
                        "stockPreparationDetails.$[elem].primaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.primaryUnit": ele.label}]
                }
            );
            /** ---------------StockPreparation -------------------------*/
            await mongoose.connection.collection("StockPreparation").updateMany(
                {"stockPreparationDetails.secondaryUnit": ele.label},
                {
                    $set: {
                        "stockPreparationDetails.$[elem].secondaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.secondaryUnit": ele.label}]
                }
            );
            /** ---------------StockTransferToStores -------------------------*/
            await mongoose.connection.collection("StockTransferToStores").updateMany(
                {"stockTransferDetails.UOM": ele.label},
                {
                    $set: {
                        "stockTransferDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------BOMOfProdItem -------------------------*/
            await mongoose.connection.collection("BOMOfProdItem").updateMany(
                {"BOMOfProdItemDetails.UOM": ele.label},
                {
                    $set: {
                        "BOMOfProdItemDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------BOMOfProdItem -------------------------*/
            await mongoose.connection.collection("BOMOfProdItem").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /** ---------------BoMOfProduct -------------------------*/
            await mongoose.connection.collection("BoMOfProduct").updateMany(
                {"BoMOfProductDetails.UOM": ele.label},
                {
                    $set: {
                        "BoMOfProductDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------BoMOfProduct -------------------------*/
            await mongoose.connection.collection("BoMOfProduct").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /** ---------------BoMOfSKU -------------------------*/
            await mongoose.connection.collection("BoMOfSKU").updateMany(
                {"BOMOfSKUDetails.UOM": ele.label},
                {
                    $set: {
                        "BOMOfSKUDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------BoMOfSKU -------------------------*/
            await mongoose.connection.collection("BoMOfSKU").updateMany(
                {"BOMOfSKUDetails.secondaryUnit": ele.label},
                {
                    $set: {
                        "BOMOfSKUDetails.$[elem].secondaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.secondaryUnit": ele.label}]
                }
            );
            /** ---------------BoMOfSKU -------------------------*/
            await mongoose.connection.collection("BoMOfSKU").updateMany(
                {"BOMOfSKUDetails.primaryUnit": ele.label},
                {
                    $set: {
                        "BOMOfSKUDetails.$[elem].primaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.primaryUnit": ele.label}]
                }
            );
            /** ---------------BoMOfSKU -------------------------*/
            await mongoose.connection.collection("BoMOfSKU").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /** ---------------BatchCardEntry -------------------------*/
            await mongoose.connection.collection("BatchCardEntry").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /** ---------------ChildPartProduction -------------------------*/
            await mongoose.connection.collection("ChildPartProduction").updateMany(
                {"childPartProductionDetails.UOM": ele.label},
                {
                    $set: {
                        "childPartProductionDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------GenericBatchIPQA -------------------------*/
            await mongoose.connection.collection("GenericBatchIPQA").updateMany(
                {"IPQALog.logEntryDetails.UOM": ele.label},
                {
                    $set: {
                        "IPQALog.logEntryDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------GenericBatchProduction -------------------------*/
            await mongoose.connection.collection("GenericBatchProduction").updateMany(
                {"prodLog.logEntryDetails.UOM": ele.label},
                {
                    $set: {
                        "prodLog.logEntryDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------GenericBatchProduction -------------------------*/
            await mongoose.connection.collection("GenericBatchProduction").updateMany(
                {"prodLog.logEntryDetails.UOM": ele.label},
                {
                    $set: {
                        "prodLog.logEntryDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------GrandPartProduction -------------------------*/
            await mongoose.connection.collection("GrandPartProduction").updateMany(
                {"groupPartProductionDetails.UOM": ele.label},
                {
                    $set: {
                        "groupPartProductionDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /** ---------------InkMixing -------------------------*/
            await mongoose.connection.collection("InkMixing").updateMany(
                {"inkMixingDetails.UOM": ele.label},
                {
                    $set: {
                        "inkMixingDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------InventoryCorrection -------------------------*/
            await mongoose.connection.collection("InventoryCorrection").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /* ---------------InventoryCorrection -------------------------*/
            await mongoose.connection.collection("InventoryCorrection").updateMany(
                {primaryUnit: ele.label},
                {
                    $set: {
                        primaryUnit: ele.value
                    }
                }
            );
            /* ---------------InventoryCorrection -------------------------*/
            await mongoose.connection.collection("InventoryCorrection").updateMany(
                {secondaryUnit: ele.label},
                {
                    $set: {
                        secondaryUnit: ele.value
                    }
                }
            );
            /* ---------------GRN -------------------------*/
            await mongoose.connection.collection("GRN").updateMany(
                {"GRNDetails.UOM": ele.label},
                {
                    $set: {
                        "GRNDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------GRN -------------------------*/
            await mongoose.connection.collection("GRN").updateMany(
                {"GRNDetails.primaryUnit": ele.label},
                {
                    $set: {
                        "GRNDetails.$[elem].primaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.primaryUnit": ele.label}]
                }
            );
            /* ---------------GRN -------------------------*/
            await mongoose.connection.collection("GRN").updateMany(
                {"GRNDetails.secondaryUnit": ele.label},
                {
                    $set: {
                        "GRNDetails.$[elem].secondaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.secondaryUnit": ele.label}]
                }
            );
            /* ---------------GoodsTransferResponse -------------------------*/
            await mongoose.connection.collection("GoodsTransferResponse").updateMany(
                {"GTDetails.UOM": ele.label},
                {
                    $set: {
                        "GTDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------GoodsTransferResponse -------------------------*/
            await mongoose.connection.collection("GoodsTransferResponse").updateMany(
                {"GTDetails.primaryUnit": ele.label},
                {
                    $set: {
                        "GTDetails.$[elem].primaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.primaryUnit": ele.label}]
                }
            );
            /* ---------------GoodsTransferResponse -------------------------*/
            await mongoose.connection.collection("GoodsTransferResponse").updateMany(
                {"GTDetails.secondaryUnit": ele.label},
                {
                    $set: {
                        "GTDetails.$[elem].secondaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.secondaryUnit": ele.label}]
                }
            );
            /* ---------------GoodsTransferResponse ------------------------- */
            await mongoose.connection.collection("GoodsTransferResponse").updateMany(
                {"GTDetails.FIFO.UOM": ele.label},
                {
                    $set: {
                        "GTDetails.$[].FIFO.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------GoodInwardEntry -------------------------*/
            await mongoose.connection.collection("GoodInwardEntry").updateMany(
                {"GINDetails.UOM": ele.label},
                {
                    $set: {
                        "GINDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------GoodInwardEntry -------------------------*/
            await mongoose.connection.collection("GoodInwardEntry").updateMany(
                {"GINDetails.primaryUnit": ele.label},
                {
                    $set: {
                        "GINDetails.$[elem].primaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.primaryUnit": ele.label}]
                }
            );
            /* ---------------GoodInwardEntry -------------------------*/
            await mongoose.connection.collection("GoodInwardEntry").updateMany(
                {"GINDetails.secondaryUnit": ele.label},
                {
                    $set: {
                        "GINDetails.$[elem].secondaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.secondaryUnit": ele.label}]
                }
            );
            /* ---------------FGINTrail -------------------------*/
            await mongoose.connection.collection("FGINTrail").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /* ---------------FGIN -------------------------*/
            await mongoose.connection.collection("FGIN").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /* ---------------FGINForSFG -------------------------*/
            await mongoose.connection.collection("FGINForSFG").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /* ---------------FGINForSFG -------------------------*/
            await mongoose.connection.collection("FGINForSFG").updateMany(
                {primaryUnit: ele.label},
                {
                    $set: {
                        primaryUnit: ele.value
                    }
                }
            );
            /* ---------------FGINForSFG -------------------------*/
            await mongoose.connection.collection("FGINForSFG").updateMany(
                {secondaryUnit: ele.label},
                {
                    $set: {
                        secondaryUnit: ele.value
                    }
                }
            );
            /* ---------------SalesForecast -------------------------*/
            await mongoose.connection.collection("SalesForecast").updateMany(
                {"salesForecastDetails.UOM": ele.label},
                {
                    $set: {
                        "salesForecastDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------SalesDebitNote -------------------------*/
            await mongoose.connection.collection("SalesDebitNote").updateMany(
                {"DNDetails.UOM": ele.label},
                {
                    $set: {
                        "DNDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------SalesDebitNote -------------------------*/
            await mongoose.connection.collection("SalesDebitNote").updateMany(
                {"DNDetails.primaryUnit": ele.label},
                {
                    $set: {
                        "DNDetails.$[elem].primaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.primaryUnit": ele.label}]
                }
            );
            /* ---------------QuotationSKU -------------------------*/
            await mongoose.connection.collection("QuotationSKU").updateMany(
                {"quotationDetails.UOM": ele.label},
                {
                    $set: {
                        "quotationDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------QuotationDSKU -------------------------*/
            await mongoose.connection.collection("QuotationDSKU").updateMany(
                {"quotationDetails.UOM": ele.label},
                {
                    $set: {
                        "quotationDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------CustomerOpenPO -------------------------*/
            await mongoose.connection.collection("CustomerOpenPO").updateMany(
                {"SKUDetails.UOM": ele.label},
                {
                    $set: {
                        "SKUDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------CreditNote -------------------------*/
            await mongoose.connection.collection("CreditNote").updateMany(
                {"CNDetails.UOM": ele.label},
                {
                    $set: {
                        "CNDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------ProductCategorySpecifications -------------------------*/
            await mongoose.connection.collection("ProductCategorySpecifications").updateMany(
                {"specificationInfo.UOM": ele.label},
                {
                    $set: {
                        "specificationInfo.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------SpecificationMaster -------------------------*/
            await mongoose.connection.collection("SpecificationMaster").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /* ---------------RMSpecification -------------------------*/
            await mongoose.connection.collection("RMSpecification").updateMany(
                {"specificationInfo.UOM": ele.label},
                {
                    $set: {
                        "specificationInfo.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------RejectedMRN -------------------------*/
            await mongoose.connection.collection("RejectedMRN").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /* ---------------ProductSpecification -------------------------*/
            await mongoose.connection.collection("ProductSpecification").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /* ---------------ProductSpecification -------------------------*/
            await mongoose.connection.collection("ProductSpecification").updateMany(
                {"specificationInfo.UOM": ele.label},
                {
                    $set: {
                        "specificationInfo.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------PreDispatchInspection ------------------------- */
            await mongoose.connection.collection("PreDispatchInspection").updateMany(
                {"preDispatchDetails.PDIEntryDetails.UOM": ele.label},
                {
                    $set: {
                        "preDispatchDetails.$[].PDIEntryDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------PreDispatchInspection -------------------------*/
            await mongoose.connection.collection("PreDispatchInspection").updateMany(
                {"preDispatchDetails.UOM": ele.label},
                {
                    $set: {
                        "preDispatchDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------MRN -------------------------*/
            await mongoose.connection.collection("MRN").updateMany(
                {"MRNDetails.UOM": ele.label},
                {
                    $set: {
                        "MRNDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------MRN ------------------------- */
            await mongoose.connection.collection("MRN").updateMany(
                {"MRNDetails.QCLevelsDetails.UOM": ele.label},
                {
                    $set: {
                        "MRNDetails.$[].QCLevelsDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            // /* ---------------MRN -------------------------*/
            await mongoose.connection.collection("MRN").updateMany(
                {"MRNDetails.primaryUnit": ele.label},
                {
                    $set: {
                        "MRNDetails.$[elem].primaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.primaryUnit": ele.label}]
                }
            );
            // /* ---------------MRN -------------------------*/
            await mongoose.connection.collection("MRN").updateMany(
                {"MRNDetails.secondaryUnit": ele.label},
                {
                    $set: {
                        "MRNDetails.$[elem].secondaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.secondaryUnit": ele.label}]
                }
            );
            // /* ---------------MaterialRevalidation -------------------------*/
            await mongoose.connection.collection("MaterialRevalidation").updateMany(
                {"MRVDetails.UOM": ele.label},
                {
                    $set: {
                        "MRVDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------MaterialRevalidation ------------------------- */
            await mongoose.connection.collection("MaterialRevalidation").updateMany(
                {"MRVDetails.QCLevelsDetails.UOM": ele.label},
                {
                    $set: {
                        "MRVDetails.$[].QCLevelsDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------MaterialRevalidation ------------------------- */
            await mongoose.connection.collection("MaterialRevalidation").updateMany(
                {"MRVDetails.QCLevelsDetails.primaryUnit": ele.label},
                {
                    $set: {
                        "MRVDetails.$[].QCLevelsDetails.$[elem].primaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.primaryUnit": ele.label}]
                }
            );
            /* ---------------MaterialRevalidation ------------------------- */
            await mongoose.connection.collection("MaterialRevalidation").updateMany(
                {"MRVDetails.QCLevelsDetails.secondaryUnit": ele.label},
                {
                    $set: {
                        "MRVDetails.$[].QCLevelsDetails.$[elem].secondaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.secondaryUnit": ele.label}]
                }
            );
            /* ---------------ItemCategorySpecifications -------------------------*/
            await mongoose.connection.collection("ItemCategorySpecifications").updateMany(
                {"specificationInfo.UOM": ele.label},
                {
                    $set: {
                        "specificationInfo.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------PurchaseOrder -------------------------*/
            await mongoose.connection.collection("PurchaseOrder").updateMany(
                {"PODetails.UOM": ele.label},
                {
                    $set: {
                        "PODetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------PurchaseOrder -------------------------*/
            await mongoose.connection.collection("PurchaseOrder").updateMany(
                {"PODetails.primaryUnit": ele.label},
                {
                    $set: {
                        "PODetails.$[elem].primaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.primaryUnit": ele.label}]
                }
            );
            /* ---------------PurchaseOrder -------------------------*/
            await mongoose.connection.collection("PurchaseOrder").updateMany(
                {"PODetails.secondaryUnit": ele.label},
                {
                    $set: {
                        "PODetails.$[elem].secondaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.secondaryUnit": ele.label}]
                }
            );
            /** ---------------PurchaseOrder -------------------------*/
            await mongoose.connection.collection("PurchaseOrder").updateMany(
                {"PODetails.purchaseRateCommon.unit1": ele.label},
                {
                    $set: {
                        "PODetails.$[].purchaseRateCommon.$[elem].unit1": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.unit1": ele.label}]
                }
            );
            /** ---------------PurchaseOrder -------------------------*/
            await mongoose.connection.collection("PurchaseOrder").updateMany(
                {"PODetails.purchaseRateCommon.unit2": ele.label},
                {
                    $set: {
                        "PODetails.$[].purchaseRateCommon.$[elem].unit2": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.unit2": ele.label}]
                }
            );
            /* ---------------DebitNote -------------------------*/
            await mongoose.connection.collection("DebitNote").updateMany(
                {"DNDetails.UOM": ele.label},
                {
                    $set: {
                        "DNDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------DebitNote ------------------------- */
            await mongoose.connection.collection("DebitNote").updateMany(
                {"DNDetails.FIFO.UOM": ele.label},
                {
                    $set: {
                        "DNDetails.$[].FIFO.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------CapitalGoods -------------------------*/
            await mongoose.connection.collection("CapitalGoods").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /* ---------------PurchaseIndent -------------------------*/
            await mongoose.connection.collection("PurchaseIndent").updateMany(
                {"indentDetails.UOM": ele.label},
                {
                    $set: {
                        "indentDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------PurchaseIndent -------------------------*/
            await mongoose.connection.collection("PurchaseIndent").updateMany(
                {"indentDetails.primaryUnit": ele.label},
                {
                    $set: {
                        "indentDetails.$[elem].primaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.primaryUnit": ele.label}]
                }
            );
            /* ---------------PurchaseIndent -------------------------*/
            await mongoose.connection.collection("PurchaseIndent").updateMany(
                {"indentDetails.secondaryUnit": ele.label},
                {
                    $set: {
                        "indentDetails.$[elem].secondaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.secondaryUnit": ele.label}]
                }
            );
            /* ---------------JobWorkOrder -------------------------*/
            await mongoose.connection.collection("JobWorkOrder").updateMany(
                {"WODetails.UOM": ele.label},
                {
                    $set: {
                        "WODetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------JobWorkChallan -------------------------*/
            await mongoose.connection.collection("JobWorkChallan").updateMany(
                {"JWChallanDetails.UOM": ele.label},
                {
                    $set: {
                        "JWChallanDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------JobWorkChallan -------------------------*/
            await mongoose.connection.collection("JobWorkChallan").updateMany(
                {"JWChallanDetails.secondaryUnit": ele.label},
                {
                    $set: {
                        "JWChallanDetails.$[elem].secondaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.secondaryUnit": ele.label}]
                }
            );
            /* ---------------JobWorkChallan -------------------------*/
            await mongoose.connection.collection("JobWorkChallan").updateMany(
                {"JWChallanDetails.primaryUnit": ele.label},
                {
                    $set: {
                        "JWChallanDetails.$[elem].primaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.primaryUnit": ele.label}]
                }
            );
            /* ---------------DeliveryChallan -------------------------*/
            await mongoose.connection.collection("DeliveryChallan").updateMany(
                {"itemDetails.UOM": ele.label},
                {
                    $set: {
                        "itemDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------Weeding -------------------------*/
            await mongoose.connection.collection("Weeding").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /* ---------------ThroughPunching -------------------------*/
            await mongoose.connection.collection("ThroughPunching").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /* ---------------StockCutting -------------------------*/
            await mongoose.connection.collection("StockCutting").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /* ---------------StageInspection -------------------------*/
            await mongoose.connection.collection("StageInspection").updateMany(
                {"stageInspectionInfo.UOM": ele.label},
                {
                    $set: {
                        "stageInspectionInfo.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------StageInspectionIPQA -------------------------*/
            await mongoose.connection.collection("StageInspectionIPQA").updateMany(
                {"stageInspectionIPQAInfo.UOM": ele.label},
                {
                    $set: {
                        "stageInspectionIPQAInfo.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------Packing -------------------------*/
            await mongoose.connection.collection("Packing").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /* ---------------Lamination -------------------------*/
            await mongoose.connection.collection("Lamination").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /* ---------------JobCardOutput -------------------------*/
            await mongoose.connection.collection("JobCardOutput").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /* ---------------JobCardOutput -------------------------*/
            await mongoose.connection.collection("JobCardOutput").updateMany(
                {"outputDetails.UOM": ele.label},
                {
                    $set: {
                        "outputDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------InkMixingLog -------------------------*/
            await mongoose.connection.collection("InkMixingLog").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /* ---------------InkMixingLog -------------------------*/
            await mongoose.connection.collection("InkMixingLog").updateMany(
                {"inkMixingLogDetails.UOM": ele.label},
                {
                    $set: {
                        "inkMixingLogDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------SKUPartProduction -------------------------*/
            await mongoose.connection.collection("SKUPartProduction").updateMany(
                {"SKUPartProductionDetails.UOM": ele.label},
                {
                    $set: {
                        "SKUPartProductionDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------JobCardEntry -------------------------*/
            await mongoose.connection.collection("JobCardEntry").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /* ---------------JCEntry -------------------------*/
            await mongoose.connection.collection("JCEntry").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /* ---------------InterProdStore -------------------------*/
            await mongoose.connection.collection("InterProdStore").updateMany(
                {UOM: ele.label},
                {
                    $set: {
                        UOM: ele.value
                    }
                }
            );
            /* ---------------InkMaster -------------------------*/
            await mongoose.connection.collection("InkMaster").updateMany(
                {UoM: ele.label},
                {
                    $set: {
                        UoM: ele.value
                    }
                }
            );
            /* ---------------InkMaster -------------------------*/
            await mongoose.connection.collection("InkMaster").updateMany(
                {primaryUnit: ele.label},
                {
                    $set: {
                        primaryUnit: ele.value
                    }
                }
            );
            /* ---------------InkMaster -------------------------*/
            await mongoose.connection.collection("InkMaster").updateMany(
                {secondaryUnit: ele.label},
                {
                    $set: {
                        secondaryUnit: ele.value
                    }
                }
            );
            /* ---------------SalesServiceMaster -------------------------*/
            await mongoose.connection.collection("SalesServiceMaster").updateMany(
                {unit: ele.label},
                {
                    $set: {
                        unit: ele.value
                    }
                }
            );
            /* ---------------ProductMaster -------------------------*/
            await mongoose.connection.collection("ProductMaster").updateMany(
                {primaryUnit: ele.label},
                {
                    $set: {
                        primaryUnit: ele.value
                    }
                }
            );
            /* ---------------ProductMaster -------------------------*/
            await mongoose.connection.collection("ProductMaster").updateMany(
                {secondaryUnit: ele.label},
                {
                    $set: {
                        secondaryUnit: ele.value
                    }
                }
            );
            /* ---------------InkMaster -------------------------*/
            await mongoose.connection.collection("InkMaster").updateMany(
                {"inkMasterDetails.UOM": ele.label},
                {
                    $set: {
                        "inkMasterDetails.$[elem].UOM": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.UOM": ele.label}]
                }
            );
            /* ---------------Items -------------------------*/
            await mongoose.connection.collection("Items").updateMany(
                {orderInfoUOM: ele.label},
                {
                    $set: {
                        orderInfoUOM: ele.value
                    }
                }
            );
            /* ---------------Items -------------------------*/
            await mongoose.connection.collection("Items").updateMany(
                {primaryUnit: ele.label},
                {
                    $set: {
                        primaryUnit: ele.value
                    }
                }
            );
            /* ---------------Items -------------------------*/
            await mongoose.connection.collection("Items").updateMany(
                {secondaryUnit: ele.label},
                {
                    $set: {
                        secondaryUnit: ele.value
                    }
                }
            );
            /* ---------------Items -------------------------*/
            await mongoose.connection.collection("Items").updateMany(
                {"channelDetails.uom1": ele.label},
                {
                    $set: {
                        "channelDetails.$[elem].uom1": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.uom1": ele.label}]
                }
            );
            /* ---------------Items -------------------------*/
            await mongoose.connection.collection("Items").updateMany(
                {"channelDetails.uom2": ele.label},
                {
                    $set: {
                        "channelDetails.$[elem].uom2": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.uom2": ele.label}]
                }
            );
            /* ---------------Items -------------------------*/
            await mongoose.connection.collection("Items").updateMany(
                {"channelDetails.primaryUnit": ele.label},
                {
                    $set: {
                        "channelDetails.$[elem].primaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.primaryUnit": ele.label}]
                }
            );
            /* ---------------Items -------------------------*/
            await mongoose.connection.collection("Items").updateMany(
                {"channelDetails.secondaryUnit": ele.label},
                {
                    $set: {
                        "channelDetails.$[elem].secondaryUnit": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.secondaryUnit": ele.label}]
                }
            );
            /* ---------------Items -------------------------*/
            await mongoose.connection.collection("Items").updateMany(
                {"supplierDetails.purchaseRateCommon.unit1": ele.label},
                {
                    $set: {
                        "supplierDetails.$[].purchaseRateCommon.$[elem].unit1": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.unit1": ele.label}]
                }
            );
            /* ---------------Items -------------------------*/
            await mongoose.connection.collection("Items").updateMany(
                {"supplierDetails.purchaseRateCommon.unit2": ele.label},
                {
                    $set: {
                        "supplierDetails.$[].purchaseRateCommon.$[elem].unit2": ele.value
                    }
                },
                {
                    arrayFilters: [{"elem.unit2": ele.label}]
                }
            );

            /* ---------------RejectedMRN -------------------------*/
            await mongoose.connection.collection("RejectedMRN").updateMany(
                {primaryUnit: ele.label},
                {
                    $set: {
                        primaryUnit: ele.value
                    }
                }
            );
            /* ---------------RejectedMRN -------------------------*/
            await mongoose.connection.collection("RejectedMRN").updateMany(
                {secondaryUnit: ele.label},
                {
                    $set: {
                        secondaryUnit: ele.value
                    }
                }
            );

            /* ---------------JobWorkItemMaster -------------------------*/
            await mongoose.connection.collection("JobWorkItemMaster").updateMany(
                {primaryUnit: ele.label},
                {
                    $set: {
                        primaryUnit: ele.value
                    }
                }
            );
            /* ---------------JobWorkItemMaster -------------------------*/
            await mongoose.connection.collection("JobWorkItemMaster").updateMany(
                {orderInfoUOM: ele.label},
                {
                    $set: {
                        orderInfoUOM: ele.value
                    }
                }
            );
            /* ---------------JobWorkItemMaster -------------------------*/
            await mongoose.connection.collection("JobWorkItemMaster").updateMany(
                {secondaryUnit: ele.label},
                {
                    $set: {
                        secondaryUnit: ele.value
                    }
                }
            );
            /* ---------------SalesUOMUnitMaster -------------------------*/
            await mongoose.connection.collection("SalesUOMUnitMaster").updateMany(
                {label: ele.label},
                {
                    $set: {
                        label: ele.value
                    }
                }
            );
            /* ---------------SalesUOMUnitMaster -------------------------*/
            await mongoose.connection.collection("SalesUOMUnitMaster").updateMany(
                {value: ele.label},
                {
                    $set: {
                        value: ele.value
                    }
                }
            );
            /* ---------------UOMUnitMaster -------------------------*/
            await mongoose.connection.collection("UOMUnitMaster").updateMany(
                {label: ele.label},
                {
                    $set: {
                        label: ele.value
                    }
                }
            );
            /* ---------------UOMUnitMaster -------------------------*/
            await mongoose.connection.collection("UOMUnitMaster").updateMany(
                {value: ele.label},
                {
                    $set: {
                        value: ele.value
                    }
                }
            );
        }

        console.log("Successfully UOM Update ");
    } catch (error) {
        console.error("error", error);
    }
};
