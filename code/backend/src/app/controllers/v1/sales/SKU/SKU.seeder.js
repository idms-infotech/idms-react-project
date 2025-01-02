const {default: mongoose} = require("mongoose");
const {OPTIONS} = require("../../../../helpers/global.options");
const {
    checkDomesticCustomer,
    getAutoIncrementNumber,
    getIncrementNumWithPrefix
} = require("../../../../helpers/utility");
const {SALES_CATEGORY} = require("../../../../mocks/constantData");
const {SKU_MASTER} = require("../../../../mocks/schemasConstant/salesConstant");
const BOMOfSKURepository = require("../../../../models/planning/repository/BOMRepository/BoMOfSKURepository");
const SKUMasterRepository = require("../../../../models/sales/repository/SKUMasterRepository");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {getAllSKUCategory, setSKUMasterAutoIncrementNo} = require("../../settings/SKUCategoryMaster/SKUCategoryMaster");
const {SKUJson, SKU_CAT_JSON} = require("./constantFile");
const {filteredDynamicFormsList} = require("../../../../models/settings/repository/dynamicFormsRepository");
const {getAllItemCategory} = require("../../purchase/itemCategoryMaster/itemCategoryMaster");

exports.updateSellingRateInCustomerInfo = async () => {
    try {
        let SKUList = await SKUMasterRepository.filteredSKUMasterList([
            // {
            //     $match: {"customerInfo.rateType": {$exists: false}}
            // },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customerInfo.customer",
                    foreignField: "_id",
                    pipeline: [{$project: {customerCategory: 1, categoryType: 1}}],
                    as: "customer"
                }
            },
            {$unwind: "$customer"},
            {
                $project: {
                    _id: 1,
                    primaryUnit: 1,
                    secondaryToPrimaryConversion: 1,
                    primaryToSecondaryConversion: 1,
                    secondaryUnit: 1,
                    customerInfo: 1,
                    customerCategory: "$customer.customerCategory",
                    categoryType: "$customer.categoryType"
                }
            }
        ]);
        for await (const ele of SKUList) {
            // const isDomestic = await checkDomesticCustomer(ele.customerCategory);
            // isDomestic ? SALES_CATEGORY.DOMESTIC : SALES_CATEGORY.IMPORTS
            let updatedDoc = await SKUMasterRepository.findAndUpdateDoc({_id: ele._id}, [
                {
                    $set: {
                        customerInfo: {
                            $map: {
                                input: "$customerInfo",
                                as: "detail",
                                in: {
                                    categoryType: ele.categoryType,
                                    customerCategory: ele.customerCategory,
                                    customer: "$$detail.customer",
                                    customerName: "$$detail.customerName",
                                    customerPartNo: "$$detail.customerPartNo",
                                    customerPartDescription: "$$detail.customerPartDescription",
                                    PONo: "$$detail.PONo",
                                    PODate: "$$detail.PODate",
                                    primaryUnit: "$$detail.primaryUnit",
                                    secondaryUnit: "$$detail.secondaryUnit",
                                    customerCurrency: "$$detail.customerCurrency",
                                    standardSellingRate: "$$detail.standardSellingRate",
                                    monthlyOffTake: "$$detail.monthlyOffTake",
                                    POValidDate: "$$detail.POValidDate",
                                    rateType: "Standard",
                                    sellingRateCommon: [
                                        {
                                            currency: "$$detail.supplierCurrency",
                                            unit1: ele.primaryUnit,
                                            MOQ1: 1,
                                            rate1: "$$detail.standardSellingRate" ?? 0,
                                            unit2: ele.secondaryUnit,
                                            MOQ2: 0,
                                            rate2: 0
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            ]);
        }
        console.log("SKU Selling Rate Updated");
    } catch (error) {
        console.error("error", error);
    }
};
const bulkMigrateSKU = async () => {
    try {
        let missingCat = [];
        let missingSKU = [];
        let list = await SKUMasterRepository.filteredSKUMasterList([
            {
                $project: {
                    _id: 1,
                    SKUNo: 1,
                    SKUName: 1,
                    SKUDescription: 1,
                    productCategory: 1,
                    company: 1
                }
            }
        ]);
        for await (const ele of list) {
            let newCategory = SKUJson.find(x => ele.SKUNo == x.SKUNo);
            if (!newCategory) {
                missingSKU.push(ele.SKUNo);
                continue;
            }
            ele.productCategory = newCategory.product;
            const SKUCategoryList = await getAllSKUCategory(ele.company, ele.productCategory);
            if (SKUCategoryList?.length > 0) {
                ele.SKUNoNew = getAutoIncrementNumber(
                    SKUCategoryList[0].SKUCategoryPrefix,
                    "",
                    SKUCategoryList[0].SKUCategoryAutoIncrement,
                    SKUCategoryList[0].digit
                );
                await setSKUMasterAutoIncrementNo(ele.productCategory);
            } else {
                missingCat.push(ele.productCategory);
                ele.SKUNoNew = await getAndSetAutoIncrementNo({...SKU_MASTER.AUTO_INCREMENT_DATA()}, companyId, true);
            }
            console.log("ele.SKUNo ", ele.SKUNoNew);
            await SKUMasterRepository.findAndUpdateDoc({SKUNo: ele.SKUNo}, [
                {
                    $set: {SKUNo: ele.SKUNoNew, productCategory: ele.productCategory}
                }
            ]);
        }
        console.log("missingCat", missingCat);
        console.log("missingSKU", missingSKU);
        console.log("SKU Updated");
    } catch (error) {
        console.error("error", error);
    }
};

// bulkMigrateSKU().then(console.log("SKU"));

const bulkMigrateSKUCategoryForVega = async () => {
    try {
        let bulkJSON = await SKUMasterRepository.filteredSKUMasterList([
            {
                $project: {
                    _id: 1,
                    company: 1,
                    productCategory: 1
                }
            }
        ]);
        for await (const ele of bulkJSON) {
            const SKUCategoryList = await getAllSKUCategory(ele.company, ele.productCategory);
            if (SKUCategoryList?.length > 0) {
                ele.SKUNoNew = getAutoIncrementNumber(
                    SKUCategoryList[0].SKUCategoryPrefix,
                    "",
                    SKUCategoryList[0].SKUCategoryAutoIncrement,
                    SKUCategoryList[0].digit
                );
                await setSKUMasterAutoIncrementNo(ele.productCategory);
            } else {
                ele.SKUNoNew = await getAndSetAutoIncrementNo({...SKU_MASTER.AUTO_INCREMENT_DATA()}, ele.company, true);
            }
            console.log("ele.SKUNo ", ele.SKUNoNew);
            await SKUMasterRepository.findAndUpdateDoc({_id: ele._id}, [
                {
                    $set: {SKUNo: ele.SKUNoNew}
                }
            ]);
        }
        console.log("SKU Updated");
    } catch (error) {
        console.error("error", error);
    }
};
// bulkMigrateSKUCategoryForVega().then(console.log("-------------------------"));
const bulkMigrateSKUForVega = async () => {
    try {
        let dynamicFormList = await filteredDynamicFormsList([
            {
                $project: {
                    _id: 1,
                    inputLabel: 1,
                    inputValue: 1
                }
            }
        ]);
        let missingSKU = [];
        let bulkJSON = SKUJson;
        await SKUMasterRepository.updateManyDoc({SKUName: {$exists: true}}, [
            {
                $set: {
                    SKUName: {$trim: {input: "$SKUName"}}
                }
            }
        ]);
        for await (const ele of bulkJSON) {
            let SKUObj = await SKUMasterRepository.findOneDoc(
                {SKUName: ele.SKUName},
                {_id: 1, company: 1, productCategory: 1}
            );
            console.log("SKUObj", SKUObj?.SKUName);
            if (SKUObj) {
                const SKUCategoryList = await getAllSKUCategory(SKUObj.company, SKUObj.productCategory);
                if (SKUCategoryList?.length > 0) {
                    SKUObj.SKUNoNew = getAutoIncrementNumber(
                        SKUCategoryList[0].SKUCategoryPrefix,
                        "",
                        SKUCategoryList[0].SKUCategoryAutoIncrement,
                        SKUCategoryList[0].digit
                    );
                    // await setSKUMasterAutoIncrementNo(SKUObj.productCategory);
                } else {
                    SKUObj.SKUNoNew = await getAndSetAutoIncrementNo(
                        {...SKU_MASTER.AUTO_INCREMENT_DATA()},
                        SKUObj.company,
                        true
                    );
                }
                let SKUInfo = [];
                for (const dynamic of dynamicFormList) {
                    if (dynamic.inputLabel == "Size") {
                        SKUInfo.push({dynamicForm: dynamic._id, inputValue: ele?.Size ?? ""});
                    }
                    if (dynamic.inputLabel == "Colour") {
                        SKUInfo.push({dynamicForm: dynamic._id, inputValue: ele?.Color ?? ""});
                    }
                    if (dynamic.inputLabel == "Finish") {
                        SKUInfo.push({dynamicForm: dynamic._id, inputValue: ele?.Finish ?? ""});
                    }
                }
                console.log("SKUObj.SKUNo ", SKUObj.SKUNoNew, SKUInfo);
                // await SKUMasterRepository.findAndUpdateDoc({_id: SKUObj._id}, [
                //     {
                //         $set: {SKUNo: SKUObj.SKUNoNew, SKUDescription: "",SKUInfo:SKUInfo}
                //     }
                // ]);
            } else {
                missingSKU.push(ele.SKUName);
            }
        }
        console.log("missingSKU", JSON.stringify(missingSKU));
        console.log("SKU Updated");
    } catch (error) {
        console.error("error", error);
    }
};
// bulkMigrateSKUForVega().then();
const updateSKUCodeBulk = async () => {
    try {
        const SKU = mongoose.model("SKUMaster");
        let SKUList = await SKU.find(
            {},
            {
                _id: 0,
                value: "$SKUNo",
                label: "$_id"
            }
        ).lean();
        // console.log("SKUList", JSON.stringify(SKUList));
        /** ---------------SampleJCCreation -------------------------*/
        let sampleJCCount = await mongoose.connection.collection("SampleJCCreation").countDocuments();
        console.log("sampleJCCount", sampleJCCount);
        /** ---------------SampleJCEntry -------------------------*/
        let SampleJCEntryCount = await mongoose.connection.collection("SampleJCEntry").countDocuments();
        console.log("SampleJCEntryCount", SampleJCEntryCount);
        /** ---------------SampleRequest -------------------------*/
        let SampleRequestCount = await mongoose.connection.collection("SampleRequest").countDocuments();
        console.log("SampleRequestCount", SampleRequestCount);
        /** ---------------SKUProcessFlow -------------------------*/
        let SKUProcessFlowCount = await mongoose.connection.collection("SKUProcessFlow").countDocuments();
        console.log("SKUProcessFlowCount", SKUProcessFlowCount);

        /** ---------------AdvanceShipmentNotice -------------------------*/
        let AdvanceShipmentNoticeCount = await mongoose.connection.collection("AdvanceShipmentNotice").countDocuments();
        console.log("AdvanceShipmentNoticeCount", AdvanceShipmentNoticeCount);

        /** ---------------SalesInvoice -------------------------*/
        let SalesInvoiceCount = await mongoose.connection.collection("SalesInvoice").countDocuments();
        console.log("SalesInvoiceCount", SalesInvoiceCount);

        /** ---------------ShipmentPlanning -------------------------*/
        let ShipmentPlanningCount = await mongoose.connection.collection("ShipmentPlanning").countDocuments();
        console.log("ShipmentPlanningCount", ShipmentPlanningCount);

        /** ---------------DirectCost -------------------------*/
        let DirectCostCount = await mongoose.connection.collection("DirectCost").countDocuments();
        console.log("DirectCostCount", DirectCostCount);

        /** ---------------JobCardCreation -------------------------*/
        let JobCardCreationCount = await mongoose.connection.collection("JobCardCreation").countDocuments();
        console.log("JobCardCreationCount", JobCardCreationCount);

        /** ---------------RoutingMaster -------------------------*/
        let RoutingMasterCount = await mongoose.connection.collection("RoutingMaster").countDocuments();
        console.log("RoutingMasterCount", RoutingMasterCount);

        /** ---------------SKUCosting -------------------------*/
        let SKUCostingCount = await mongoose.connection.collection("SKUCosting").countDocuments();
        console.log("SKUCostingCount", SKUCostingCount);

        /** ---------------SKUCostSheet -------------------------*/
        let SKUCostSheetCount = await mongoose.connection.collection("SKUCostSheet").countDocuments();
        console.log("SKUCostSheetCount", SKUCostSheetCount);

        /** ---------------StockPreparation -------------------------*/
        let StockPreparationCount = await mongoose.connection.collection("StockPreparation").countDocuments();
        console.log("StockPreparationCount", StockPreparationCount);

        /** ---------------FGCorrection -------------------------*/
        let FGCorrectionCount = await mongoose.connection.collection("FGCorrection").countDocuments();
        console.log("FGCorrectionCount", FGCorrectionCount);

        /** ---------------GenericIPQA -------------------------*/
        let GenericIPQACount = await mongoose.connection.collection("GenericIPQA").countDocuments();
        console.log("GenericIPQACount", GenericIPQACount);

        /** ---------------GenericIPQC -------------------------*/
        let GenericIPQCCount = await mongoose.connection.collection("GenericIPQC").countDocuments();
        console.log("GenericIPQCCount", GenericIPQCCount);

        /** ---------------GenericProduction -------------------------*/
        let GenericProductionCount = await mongoose.connection.collection("GenericProduction").countDocuments();
        console.log("GenericProductionCount", GenericProductionCount);

        /** ---------------InkMixingLogIPQA -------------------------*/
        let InkMixingLogIPQACount = await mongoose.connection.collection("InkMixingLogIPQA").countDocuments();
        console.log("InkMixingLogIPQACount", InkMixingLogIPQACount);
        /** ---------------InkMixingLog -------------------------*/
        let InkMixingLogCount = await mongoose.connection.collection("InkMixingLog").countDocuments();
        console.log("InkMixingLogCount", InkMixingLogCount);

        /** ---------------JCEntry -------------------------*/
        let JCEntryCount = await mongoose.connection.collection("JCEntry").countDocuments();
        console.log("JCEntryCount", JCEntryCount);
        /** ---------------JobCardEntry -------------------------*/
        let JobCardEntryCount = await mongoose.connection.collection("JobCardEntry").countDocuments();
        console.log("JobCardEntryCount", JobCardEntryCount);
        /** ---------------JobCardOutput -------------------------*/
        let JobCardOutputCount = await mongoose.connection.collection("JobCardOutput").countDocuments();
        console.log("JobCardOutputCount", JobCardOutputCount);
        /** ---------------LaminationIPQA -------------------------*/
        let LaminationIPQACount = await mongoose.connection.collection("LaminationIPQA").countDocuments();
        console.log("LaminationIPQACount", LaminationIPQACount);
        /** ---------------Lamination -------------------------*/
        let LaminationCount = await mongoose.connection.collection("Lamination").countDocuments();
        console.log("LaminationCount", LaminationCount);
        /** ---------------PackingIPQA -------------------------*/
        let PackingIPQACount = await mongoose.connection.collection("PackingIPQA").countDocuments();
        console.log("PackingIPQACount", PackingIPQACount);
        /** ---------------Packing -------------------------*/
        let PackingCount = await mongoose.connection.collection("Packing").countDocuments();
        console.log("PackingCount", PackingCount);
        /** ---------------ScreenMakingLogIPQA -------------------------*/
        let ScreenMakingLogIPQACount = await mongoose.connection.collection("ScreenMakingLogIPQA").countDocuments();
        console.log("ScreenMakingLogIPQACount", ScreenMakingLogIPQACount);
        /** ---------------ScreenMakingLog -------------------------*/
        let ScreenMakingLogCount = await mongoose.connection.collection("ScreenMakingLog").countDocuments();
        console.log("ScreenMakingLogCount", ScreenMakingLogCount);
        /** ---------------ScreenPrintingLogIPQA -------------------------*/
        let ScreenPrintingLogIPQACount = await mongoose.connection.collection("ScreenPrintingLogIPQA").countDocuments();
        console.log("ScreenPrintingLogIPQACount", ScreenPrintingLogIPQACount);
        /** ---------------ScreenPrintingLog -------------------------*/
        let ScreenPrintingLogCount = await mongoose.connection.collection("ScreenPrintingLog").countDocuments();
        console.log("ScreenPrintingLogCount", ScreenPrintingLogCount);
        /** ---------------SKUPartProduction -------------------------*/
        let SKUPartProductionCount = await mongoose.connection.collection("SKUPartProduction").countDocuments();
        console.log("SKUPartProductionCount", SKUPartProductionCount);
        /** ---------------StageInspectionIPQA -------------------------*/
        let StageInspectionIPQACount = await mongoose.connection.collection("StageInspectionIPQA").countDocuments();
        console.log("StageInspectionIPQACount", StageInspectionIPQACount);
        /** ---------------StageInspection -------------------------*/
        let StageInspectionCount = await mongoose.connection.collection("StageInspection").countDocuments();
        console.log("StageInspectionCount", StageInspectionCount);
        /** ---------------StockCuttingIPQA -------------------------*/
        let StockCuttingIPQACount = await mongoose.connection.collection("StockCuttingIPQA").countDocuments();
        console.log("StockCuttingIPQACount", StockCuttingIPQACount);
        /** ---------------StockCutting -------------------------*/
        let StockCuttingCount = await mongoose.connection.collection("StockCutting").countDocuments();
        console.log("StockCuttingCount", StockCuttingCount);
        /** ---------------ThroughPunchingIPQA -------------------------*/
        let ThroughPunchingIPQACount = await mongoose.connection.collection("ThroughPunchingIPQA").countDocuments();
        console.log("ThroughPunchingIPQACount", ThroughPunchingIPQACount);
        /** ---------------ThroughPunching -------------------------*/
        let ThroughPunchingCount = await mongoose.connection.collection("ThroughPunching").countDocuments();
        console.log("ThroughPunchingCount", ThroughPunchingCount);
        /** ---------------WeedingIPQA -------------------------*/
        let WeedingIPQACount = await mongoose.connection.collection("WeedingIPQA").countDocuments();
        console.log("WeedingIPQACount", WeedingIPQACount);
        /** ---------------Weeding -------------------------*/
        let WeedingCount = await mongoose.connection.collection("Weeding").countDocuments();
        console.log("WeedingCount", WeedingCount);
        /** ---------------PreDispatchInspection -------------------------*/
        let PreDispatchInspectionCount = await mongoose.connection.collection("PreDispatchInspection").countDocuments();
        console.log("PreDispatchInspectionCount", PreDispatchInspectionCount);
        /** ---------------ProductSpecification -------------------------*/
        let ProductSpecificationCount = await mongoose.connection.collection("ProductSpecification").countDocuments();
        console.log("ProductSpecificationCount", ProductSpecificationCount);
        /** ---------------CreditNote -------------------------*/
        let CreditNoteCount = await mongoose.connection.collection("CreditNote").countDocuments();
        console.log("CreditNoteCount", CreditNoteCount);
        /** ---------------CustomerDiscountManagement -------------------------*/
        let CustomerDiscountManagementCount = await mongoose.connection
            .collection("CustomerDiscountManagement")
            .countDocuments();
        console.log("CustomerDiscountManagementCount", CustomerDiscountManagementCount);
        /** ---------------DirectTaxInvoice -------------------------*/
        let DirectTaxInvoiceCount = await mongoose.connection.collection("DirectTaxInvoice").countDocuments();
        console.log("DirectTaxInvoiceCount", DirectTaxInvoiceCount);
        /** ---------------DispatchRequestNote -------------------------*/
        let DispatchRequestNoteCount = await mongoose.connection.collection("DispatchRequestNote").countDocuments();
        console.log("DispatchRequestNoteCount", DispatchRequestNoteCount);
        /** ---------------ProformaInvoice -------------------------*/
        let ProformaInvoiceCount = await mongoose.connection.collection("ProformaInvoice").countDocuments();
        console.log("ProformaInvoiceCount", ProformaInvoiceCount);
        /** ---------------QuotationSKU -------------------------*/
        let QuotationSKUCount = await mongoose.connection.collection("QuotationSKU").countDocuments();
        console.log("QuotationSKUCount", QuotationSKUCount);
        /** ---------------SalesDebitNote -------------------------*/
        let SalesDebitNoteCount = await mongoose.connection.collection("SalesDebitNote").countDocuments();
        console.log("SalesDebitNoteCount", SalesDebitNoteCount);
        /** ---------------SalesForecast -------------------------*/
        let SalesForecastCount = await mongoose.connection.collection("SalesForecast").countDocuments();
        console.log("SalesForecastCount", SalesForecastCount);
        /** ---------------SalesOrder -------------------------*/
        let SalesOrderCount = await mongoose.connection.collection("SalesOrder").countDocuments();
        console.log("SalesOrderCount", SalesOrderCount);
        /** ---------------FGIN -------------------------*/
        let FGINCount = await mongoose.connection.collection("FGIN").countDocuments();
        console.log("FGINCount", FGINCount);
        /** ---------------FGINTrail -------------------------*/
        let FGINTrailCount = await mongoose.connection.collection("FGINTrail").countDocuments();
        console.log("FGINTrailCount", FGINTrailCount);
        /** ---------------BoMOfSKU -------------------------*/
        let BoMOfSKUCount = await mongoose.connection.collection("BoMOfSKU").countDocuments();
        console.log("BoMOfSKUCount", BoMOfSKUCount);
        for await (const ele of SKUList) {
            console.log("ele", ele.value);
            /** --------------SampleJCCreation-------------------------*/
            if (sampleJCCount > 0) {
                let output = await mongoose.connection.collection("SampleJCCreation").updateMany(
                    {"SKUDetails.SKU": ele.label},
                    {
                        $set: {
                            "SKUDetails.$[elem].SKUNo": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.SKU": ele.label}]
                    }
                );
                console.log("SampleJCCreation output", output);
            }
            /** --------------SampleJCEntry-------------------------*/
            if (SampleJCEntryCount > 0) {
                let output = await mongoose.connection.collection("SampleJCEntry").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("SampleJCEntry output", output);
            }
            /** --------------ShipmentPlanning-------------------------*/
            if (ShipmentPlanningCount > 0) {
                let output = await mongoose.connection.collection("ShipmentPlanning").updateMany(
                    {"SPDetails.SKU": ele.label},
                    {
                        $set: {
                            "SPDetails.$[elem].SKUNo": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.SKU": ele.label}]
                    }
                );
                console.log("ShipmentPlanning output", output.modifiedCount);
            }
            /** --------------DirectCost-------------------------*/
            if (DirectCostCount > 0) {
                let output = await mongoose.connection.collection("DirectCost").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("DirectCost output", output);
            }
            /** --------------JobCardCreation-------------------------*/
            if (JobCardCreationCount > 0) {
                let output = await mongoose.connection.collection("JobCardCreation").updateMany(
                    {"SKUDetails.SKU": ele.label},
                    {
                        $set: {
                            "SKUDetails.$[elem].SKUNo": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.SKU": ele.label}]
                    }
                );
                console.log("JobCardCreation output", output);
            }
            /** --------------RoutingMaster-------------------------*/
            if (RoutingMasterCount > 0) {
                let output = await mongoose.connection.collection("RoutingMaster").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUCode: ele.value
                        }
                    }
                );
                console.log("RoutingMaster output", output);
            }
            /** --------------SKUCosting-------------------------*/
            if (SKUCostingCount > 0) {
                let output = await mongoose.connection.collection("SKUCosting").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUCode: ele.value
                        }
                    }
                );
                console.log("SKUCosting output", output);
            }
            /** --------------SKUCostSheet-------------------------*/
            if (SKUCostSheetCount > 0) {
                let output = await mongoose.connection.collection("SKUCostSheet").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("SKUCostSheet output", output);
            }
            /** --------------StockPreparation-------------------------*/
            if (StockPreparationCount > 0) {
                let output = await mongoose.connection.collection("StockPreparation").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("StockPreparation output", output);
            }
            /** --------------FGCorrection-------------------------*/
            if (FGCorrectionCount > 0) {
                let output = await mongoose.connection.collection("FGCorrection").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("FGCorrection output", output);
            }
            /** --------------GenericIPQA-------------------------*/
            if (GenericIPQACount > 0) {
                let output = await mongoose.connection.collection("GenericIPQA").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("GenericIPQA output", output);
            }
            /** --------------GenericIPQC-------------------------*/
            if (GenericIPQCCount > 0) {
                let output = await mongoose.connection.collection("GenericIPQC").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("GenericIPQC output", output);
            }
            /** --------------GenericProduction-------------------------*/
            if (GenericProductionCount > 0) {
                let output = await mongoose.connection.collection("GenericProduction").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("GenericProduction output", output);
            }
            /** --------------InkMixingLogIPQA-------------------------*/
            if (InkMixingLogIPQACount > 0) {
                let output = await mongoose.connection.collection("InkMixingLogIPQA").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("InkMixingLogIPQA output", output);
            }
            /** --------------InkMixingLog-------------------------*/
            if (InkMixingLogCount > 0) {
                let output = await mongoose.connection.collection("InkMixingLog").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("InkMixingLog output", output);
            }
            /** --------------JCEntry-------------------------*/
            if (JCEntryCount > 0) {
                let output = await mongoose.connection.collection("JCEntry").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("JCEntry output", output);
            }
            /** --------------JobCardEntry-------------------------*/
            if (JobCardEntryCount > 0) {
                let output = await mongoose.connection.collection("JobCardEntry").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("JobCardEntry output", output);
            }
            /** --------------JobCardOutput-------------------------*/
            if (JobCardOutputCount > 0) {
                let output = await mongoose.connection.collection("JobCardOutput").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("JobCardOutput output", output);
            }
            /** --------------LaminationIPQA-------------------------*/
            if (LaminationIPQACount > 0) {
                let output = await mongoose.connection.collection("LaminationIPQA").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("LaminationIPQA output", output);
            }
            /** --------------Lamination-------------------------*/
            if (LaminationCount > 0) {
                let output = await mongoose.connection.collection("Lamination").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("Lamination output", output);
            }
            /** --------------PackingIPQA-------------------------*/
            if (PackingIPQACount > 0) {
                let output = await mongoose.connection.collection("PackingIPQA").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("PackingIPQA output", output);
            }
            /** --------------Packing-------------------------*/
            if (PackingCount > 0) {
                let output = await mongoose.connection.collection("Packing").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("Packing output", output);
            }
            /** --------------ScreenMakingLogIPQA-------------------------*/
            if (ScreenMakingLogIPQACount > 0) {
                let output = await mongoose.connection.collection("ScreenMakingLogIPQA").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("ScreenMakingLogIPQA output", output);
            }
            /** --------------ScreenMakingLog-------------------------*/
            if (ScreenMakingLogCount > 0) {
                let output = await mongoose.connection.collection("ScreenMakingLog").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("ScreenMakingLog output", output);
            }
            /** --------------ScreenPrintingLogIPQA-------------------------*/
            if (ScreenPrintingLogIPQACount > 0) {
                let output = await mongoose.connection.collection("ScreenPrintingLogIPQA").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("ScreenPrintingLogIPQA output", output);
            }
            /** --------------ScreenPrintingLog-------------------------*/
            if (ScreenPrintingLogCount > 0) {
                let output = await mongoose.connection.collection("ScreenPrintingLog").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("ScreenPrintingLog output", output);
            }
            /** --------------SKUPartProduction-------------------------*/
            if (SKUPartProductionCount > 0) {
                let output = await mongoose.connection.collection("SKUPartProduction").updateMany(
                    {"SKUPartProductionDetails.SKU": ele.label},
                    {
                        $set: {
                            "SKUPartProductionDetails.$[elem].SKUCode": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.SKU": ele.label}]
                    }
                );
                console.log("SKUPartProduction output", output);
            }
            /** --------------StageInspectionIPQA-------------------------*/
            if (StageInspectionIPQACount > 0) {
                let output = await mongoose.connection.collection("StageInspectionIPQA").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("StageInspectionIPQA output", output);
            }
            /** --------------StageInspection-------------------------*/
            if (StageInspectionCount > 0) {
                let output = await mongoose.connection.collection("StageInspection").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("StageInspection output", output);
            }
            /** --------------StockCuttingIPQA-------------------------*/
            if (StockCuttingIPQACount > 0) {
                let output = await mongoose.connection.collection("StockCuttingIPQA").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("StockCuttingIPQA output", output);
            }
            /** --------------StockCutting-------------------------*/
            if (StockCuttingCount > 0) {
                let output = await mongoose.connection.collection("StockCutting").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("StockCutting output", output);
            }
            /** --------------ThroughPunchingIPQA-------------------------*/
            if (ThroughPunchingIPQACount > 0) {
                let output = await mongoose.connection.collection("ThroughPunchingIPQA").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("ThroughPunchingIPQA output", output);
            }
            /** --------------ThroughPunching-------------------------*/
            if (ThroughPunchingCount > 0) {
                let output = await mongoose.connection.collection("ThroughPunching").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("ThroughPunching output", output);
            }
            /** --------------WeedingIPQA-------------------------*/
            if (WeedingIPQACount > 0) {
                let output = await mongoose.connection.collection("WeedingIPQA").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("WeedingIPQA output", output);
            }
            /** --------------Weeding-------------------------*/
            if (WeedingCount > 0) {
                let output = await mongoose.connection.collection("Weeding").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("Weeding output", output);
            }
            /** --------------PreDispatchInspection-------------------------*/
            if (PreDispatchInspectionCount > 0) {
                let output = await mongoose.connection.collection("PreDispatchInspection").updateMany(
                    {"preDispatchDetails.SKU": ele.label},
                    {
                        $set: {
                            "preDispatchDetails.$[elem].SKUNo": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.SKU": ele.label}]
                    }
                );
                console.log("PreDispatchInspection output", output);
            }
            /** --------------ProductSpecification-------------------------*/
            if (ProductSpecificationCount > 0) {
                let output = await mongoose.connection.collection("ProductSpecification").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("ProductSpecification output", output);
            }

            /** --------------DispatchRequestNote-------------------------*/
            if (DispatchRequestNoteCount > 0) {
                let output = await mongoose.connection.collection("DispatchRequestNote").updateMany(
                    {"DRNDetails.SKU": ele.label},
                    {
                        $set: {
                            "DRNDetails.$[elem].SKUNo": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.SKU": ele.label}]
                    }
                );
                console.log("DispatchRequestNote output", output);
            }

            /** --------------QuotationSKU-------------------------*/
            if (QuotationSKUCount > 0) {
                let output = await mongoose.connection.collection("QuotationSKU").updateMany(
                    {"quotationDetails.SKU": ele.label},
                    {
                        $set: {
                            "quotationDetails.$[elem].SKUNo": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.SKU": ele.label}]
                    }
                );
                console.log("QuotationSKU output", output);
            }

            /** --------------SalesForecast-------------------------*/
            if (SalesForecastCount > 0) {
                let output = await mongoose.connection.collection("SalesForecast").updateMany(
                    {"salesForecastDetails.SKU": ele.label},
                    {
                        $set: {
                            "salesForecastDetails.$[elem].SKUNo": ele.value
                        }
                    },
                    {
                        arrayFilters: [{"elem.SKU": ele.label}]
                    }
                );
                console.log("SalesForecast output", output);
            }

            /** --------------FGIN-------------------------*/
            if (FGINCount > 0) {
                let output = await mongoose.connection.collection("FGIN").updateMany(
                    {SKUId: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("FGIN output", output);
            }
            /** --------------FGINTrail-------------------------*/
            if (FGINTrailCount > 0) {
                let output = await mongoose.connection.collection("FGINTrail").updateMany(
                    {SKUId: ele.label},
                    {
                        $set: {
                            SKUNo: ele.value
                        }
                    }
                );
                console.log("FGINTrail output", output);
            }
            /** --------------BoMOfSKU-------------------------*/
            if (BoMOfSKUCount > 0) {
                let output = await mongoose.connection.collection("BoMOfSKU").updateMany(
                    {SKU: ele.label},
                    {
                        $set: {
                            SKUCode: ele.value
                        }
                    }
                );
                console.log("BoMOfSKU output", output);
            }
        }
        console.log("Successfully SKU code saved");
    } catch (error) {
        console.error("error", error);
    }
};

// updateSKUCodeBulk().then(console.log("---------------"));

const bulkMigrateSKUByCategory = async () => {
    try {
        let missingCat = [];
        let SKUList = await SKUMasterRepository.filteredSKUMasterList([
            {
                $project: {
                    _id: 1,
                    SKUNo: 1,
                    productCategory: 1,
                    company: 1
                }
            }
        ]);
        const categoryMap = new Map(SKU_CAT_JSON.map(z => [z["SKU Category"], z["New Category To be Amend"]]));
        for await (const ele of SKUList) {
            if (!categoryMap.get(ele.productCategory)) missingCat.push(ele.productCategory);
            ele.productCategory = categoryMap.get(ele.productCategory);
            let categoryList = await getAllSKUCategory(ele.company);
            if (categoryList?.length) {
                let category = categoryList.find(x => ele.productCategory == x.SKUCategoryName);
                // console.log("category", category);
                if (!!category) {
                    ele.SKUNo = getIncrementNumWithPrefix({
                        modulePrefix: category.SKUCategoryPrefix,
                        autoIncrementValue: category.SKUCategoryAutoIncrement,
                        digit: category.digit
                    });
                }
                await setSKUMasterAutoIncrementNo(ele.productCategory);
            }
            console.log("ele.SKUNo", ele.SKUNo);
            let output = await SKUMasterRepository.findAndUpdateDoc(
                {_id: ele._id},
                {
                    SKUNo: ele.SKUNo,
                    productCategory: ele.productCategory
                }
            );
            // console.log("output", output);
        }
        console.log("missingCat", missingCat);
        console.log("SKU Category Type Updated");
    } catch (error) {
        console.error("error", error);
    }
};
// bulkMigrateSKUByCategory().then(console.log("SKU_PREFIX"));
