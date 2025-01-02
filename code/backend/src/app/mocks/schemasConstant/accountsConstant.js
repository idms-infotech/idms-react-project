exports.INVOICE_PAYMENT = {
    COLLECTION_NAME: "InvoicePayment",
    ADDED_ACTION: "Service Payment created",
    UPDATED_ACTION: "Service Payment updated",
    MODULE_NAME: "Invoice Payment",
    MODULE: "InvoicePayment"
    // MODULE_PREFIX: "JC/",
    // AUTO_INCREMENT_DATA: function () {
    //     return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    // }
};
exports.TRAVEL_REQUEST = {
    COLLECTION_NAME: "TravelRequest",
    ADDED_ACTION: "Travel Request created",
    UPDATED_ACTION: "Travel Request updated",
    MODULE_NAME: "Travel Request",
    MODULE: "TRL",
    MODULE_PREFIX: "TRL",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};

exports.PURCHASE_REGISTER_ENTRY = {
    COLLECTION_NAME: "PurchaseRegisterEntry",
    ADDED_ACTION: "Purchase Register Entry created",
    UPDATED_ACTION: "Purchase Register Entry updated",
    MODULE_NAME: "Purchase Register Entry",
    MODULE: "PurchaseRegisterEntry",
    MODULE_PREFIX: "PE/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};
