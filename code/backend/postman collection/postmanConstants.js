exports.MAIN_MODULE_NAME = "sales";
exports.MASTER_TRANSACT_REPORT = ["Masters", "Transactions"];
exports.SUB_MODULE_NAME = {
    Masters: [
        "salesHSN",
        "customerMaster",
        "SKU",
        "salesSAC",
        "serviceMaster",
        "B2c",
        "paymentTerms",
        "mapCategoryHSNMaster",
        "transporter"
    ],
    Transactions: [
        "creditNote",
        "dispatchRequestNote",
        "proformaInvoice",
        "quotationDSKU",
        "quotationSKU",
        "sales-forecast",
        "salesDebitNote",
        "salesOrder",
        "serviceInvoice"
    ]
    // {
    //     Reports: ["purchaseOrder", "servicePurchaseOrder"]
    // }
};

exports.getFoldersLocation = (collection, MTR, subModuleObj) => {
    try {
        let mainModule = collection.item.find(item => item.name == this.MAIN_MODULE_NAME);
        if (!mainModule) {
            collection.item.push({
                name: this.MAIN_MODULE_NAME,
                item: []
            });
        }
        mainModule = collection.item.find(item => item.name == this.MAIN_MODULE_NAME);
        let masterTransactionReports = mainModule.item.find(x => x.name == MTR);
        if (!masterTransactionReports) {
            mainModule.item.push({
                name: MTR,
                item: []
            });
        }
        masterTransactionReports = mainModule.item.find(x => x.name == MTR);
        let subModule = masterTransactionReports.item.find(x => x.name == subModuleObj.subModule);
        if (!subModule) {
            masterTransactionReports.item.push({
                name: subModuleObj.subModule,
                item: []
            });
        }
        subModule = masterTransactionReports.item.find(x => x.name == subModuleObj.subModule);
        return subModule;
    } catch (error) {
        console.error("error", error);
    }
};

// accounts
// businessLeads
// dashboard
// dispatch
// finance
// HR
// index.js
// maintenance
// planning
// production
// purchase
// quality
// sales
// settings
// shared
// stores
// supports
