exports.ASSET = {
    COLLECTION_NAME: "Asset",
    ADDED_ACTION: "Asset created",
    UPDATED_ACTION: "Asset updated",
    MODULE_NAME: "Asset",
    MODULE: "Asset"
    // MODULE_PREFIX: "JC/",
    // AUTO_INCREMENT_DATA: function () {
    //     return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    // }
};
exports.LABOUR_RATE = {
    COLLECTION_NAME: "LabourRateMaster",
    ADDED_ACTION: "Labour Rate Finance Master created",
    UPDATED_ACTION: "Labour Rate Finance Master updated",
    MODULE_NAME: "Labour Rate Master",
    MODULE: "LabourRateMaster"
    // MODULE_PREFIX: "JC/",
    // AUTO_INCREMENT_DATA: function () {
    //     return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    // }
};
exports.OPERATING_EXPENSES = {
    COLLECTION_NAME: "OperatingExpenses",
    ADDED_ACTION: "Operating Expenses created",
    UPDATED_ACTION: "Operating Expenses updated",
    MODULE_NAME: "Operating Expenses",
    MODULE: "OperatingExpenses"
    // MODULE_PREFIX: "JC/",
    // AUTO_INCREMENT_DATA: function () {
    //     return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    // }
};

exports.PROCESS_SPEC_BY_PROD_CATEGORY = {
    COLLECTION_NAME: "ProcessSpecByProdCategory",
    ADDED_ACTION: "Process Specification By Product Category created",
    UPDATED_ACTION: "Process Specification By Product Category updated",
    MODULE_NAME: "Process Specification By Product Category",
    MODULE: "ProcessSpecByProdCategory",
    MODULE_PREFIX: "PSP/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
}