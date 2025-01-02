exports.ADVANCE_SHIPMENT_NOTICE = {
    COLLECTION_NAME: "AdvanceShipmentNotice",
    ADDED_ACTION: "Advanced Shipment Notice created",
    UPDATED_ACTION: "Advanced Shipment Notice updated"
    // MODULE_NAME: "",
    // MODULE: "",
    // MODULE_PREFIX: "",
    // AUTO_INCREMENT_DATA: function () {
    //     return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    // }
};
exports.SALES_INVOICE = {
    COLLECTION_NAME: "SalesInvoice",
    ADDED_ACTION: "Sales Invoice created",
    UPDATED_ACTION: "Sales Invoice updated",
    MODULE_NAME: "Sales Invoice",
    MODULE: "TI",
    MODULE_PREFIX: "TI",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.SHIPMENT_PLANNING = {
    COLLECTION_NAME: "ShipmentPlanning",
    ADDED_ACTION: "Shipment Planning created",
    UPDATED_ACTION: "Shipment Planning updated",
    MODULE_NAME: "Shipment Planning",
    MODULE: "SID",
    MODULE_PREFIX: "SID",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
