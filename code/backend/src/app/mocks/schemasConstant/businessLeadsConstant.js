exports.BOM_DSKU = {
    COLLECTION_NAME: "BoMOfDSKU",
    ADDED_ACTION: "BoM Of SKU created",
    UPDATED_ACTION: "BoM Of SKU updated",
    MODULE_NAME: "BoM Of DSKU",
    MODULE: "BOMDSKU",
    MODULE_PREFIX: "BD",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.CHECKLIST_PARTICULARS = {
    COLLECTION_NAME: "ChecklistParticulars",
    ADDED_ACTION: "Checklist Particulars Master created",
    UPDATED_ACTION: "Checklist Particulars Master updated",
    // MODULE_NAME: "BoM Of DSKU",
    MODULE: "ChecklistParticulars"
    // MODULE_PREFIX: "BOMDSKU",
    // AUTO_INCREMENT_DATA: function () {
    //     return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    // }
};
exports.DIRECT_COST_DSKU = {
    COLLECTION_NAME: "DirectCostDSKU",
    ADDED_ACTION: "Direct Cost DSKU created",
    UPDATED_ACTION: "Direct Cost DSKU updated",
    MODULE_NAME: "Direct Cost DSKU",
    MODULE: "DC-DSKU",
    MODULE_PREFIX: "DC-DSKU",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.DSKU_COST_SHEET = {
    COLLECTION_NAME: "DSKUCostSheet",
    ADDED_ACTION: "DSKU Cost Sheet created",
    UPDATED_ACTION: "DSKU Cost Sheet updated",
    MODULE_NAME: "DSKU Cost Sheet",
    MODULE: "DSKU-CS",
    MODULE_PREFIX: "DSKU-CS",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.NPD_MASTER = {
    COLLECTION_NAME: "NPDMaster",
    ADDED_ACTION: "NPD Master created",
    UPDATED_ACTION: "NPD Master updated",
    MODULE_NAME: "NPD Master",
    MODULE: "NPDM",
    MODULE_PREFIX: "NPDM",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.NPD_REQUEST = {
    COLLECTION_NAME: "NPD",
    ADDED_ACTION: "NPD Request created",
    UPDATED_ACTION: "NPD Request updated",
    MODULE_NAME: "NPD Request",
    MODULE: "ND",
    MODULE_PREFIX: "ND",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.NPD_REVIEW = {
    COLLECTION_NAME: "NPDReview",
    ADDED_ACTION: "NPD Review for Feasibility created",
    UPDATED_ACTION: "NPD Review for Feasibility updated",
    MODULE_NAME: "NPD Review",
    MODULE: "NR",
    MODULE_PREFIX: "NR",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.PROSPECT_MASTER = {
    COLLECTION_NAME: "Prospect",
    ADDED_ACTION: "Prospect Master created",
    UPDATED_ACTION: "Prospect Master updated",
    MODULE_NAME: "Prospect",
    MODULE: "P",
    MODULE_PREFIX: "P",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.TECHNICAL_QUESTIONNAIRE = {
    COLLECTION_NAME: "TechnicalQuestionnaire",
    ADDED_ACTION: "Question Master created",
    UPDATED_ACTION: "Question Master updated",
    // MODULE_NAME: "Prospect",
    MODULE: "TechnicalQuestionnaire"
    // MODULE_PREFIX: "P",
    // AUTO_INCREMENT_DATA: function () {
    //     return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    // }
};

exports.SAMPLE_REQUEST = {
    COLLECTION_NAME: "SampleRequest",
    ADDED_ACTION: "Sample Request created",
    UPDATED_ACTION: "Sample Request updated",
    MODULE_NAME: "Sample Request",
    MODULE: "SampleRequest",
    MODULE_PREFIX: "SR/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
}
exports.SAMPLE_JC_CREATION = {
    COLLECTION_NAME: "SampleJCCreation",
    ADDED_ACTION: "Sample JC Creation created",
    UPDATED_ACTION: "Sample JC Creation updated",
    MODULE_NAME: "Sample JC Creation",
    MODULE: "SampleJCCreation",
    MODULE_PREFIX: "SJC/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
}
exports.SAMPLE_JC_ENTRY = {
    COLLECTION_NAME: "SampleJCEntry",
    ADDED_ACTION: "Sample JC Entry created",
    UPDATED_ACTION: "Sample JC Entry updated",
    MODULE_NAME: "Sample JC Entry",
    MODULE: "SampleJCEntry",
    MODULE_PREFIX: "SJCE/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
}
exports.SKU_PROCESS_FLOW = {
    COLLECTION_NAME: "SKUProcessFlow",
    ADDED_ACTION: "SKU Process Flow created",
    UPDATED_ACTION: "SKU Process Flow updated",
    MODULE_NAME: "SKU Process Flow",
    MODULE: "SKUProcessFlow",
    MODULE_PREFIX: "SJCE/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
}