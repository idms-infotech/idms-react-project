exports.FGIN_SCHEMA = {
    COLLECTION_NAME: "FGIN",
    ADDED_ACTION: "FGIN created",
    UPDATED_ACTION: "FGIN updated",
    MODULE_NAME: "FGIN",
    MODULE: "FGIN",
    MODULE_PREFIX: "FGIN",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.GOOD_INWARD_ENTRY = {
    COLLECTION_NAME: "GoodInwardEntry",
    ADDED_ACTION: "Good Inward Entry created",
    UPDATED_ACTION: "Good Inward Entry updated",
    MODULE_NAME: "Good Inward Entry",
    MODULE: "GIN",
    MODULE_PREFIX: "GIN",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.GOOD_ISSUE = {
    COLLECTION_NAME: "GoodsIssue",
    ADDED_ACTION: "Goods Issue created",
    UPDATED_ACTION: "Goods Issue updated",
    MODULE_NAME: "Goods Issue",
    MODULE: "GOODS_ISSUE",
    MODULE_PREFIX: "GOODS_ISSUE",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.GOODS_RECEIPT_NOTE = {
    COLLECTION_NAME: "GRN",
    ADDED_ACTION: "Goods Receipt Note created",
    UPDATED_ACTION: "Goods Receipt Note updated",
    MODULE_NAME: "Goods Receipt Note",
    MODULE: "GRN",
    MODULE_PREFIX: "GRN",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.INVENTORY_CORRECTION = {
    COLLECTION_NAME: "InventoryCorrection",
    ADDED_ACTION: "Inventory Correction created",
    UPDATED_ACTION: "Inventory Correction updated",
    MODULE_NAME: "Inventory Correction",
    MODULE: "InventoryCorrection",
    MODULE_PREFIX: "IC",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};

exports.GOODS_TRANSFER_RESPONSE = {
    COLLECTION_NAME: "GoodsTransferResponse",
    ADDED_ACTION: "Goods Transfer created",
    UPDATED_ACTION: "Goods Transfer updated",
    MODULE_NAME: "Goods Transfer",
    MODULE: "GoodsTransferResponse",
    MODULE_PREFIX: "GT/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};

exports.FGIN_TRAIL = {
    COLLECTION_NAME: "FGINTrail",
    ADDED_ACTION: "FGIN Trail created",
    UPDATED_ACTION: "FGIN Trail updated",
    // MODULE_NAME: "FGIN Trail",
    // MODULE: "FGINTrail",
    // MODULE_PREFIX: "null",
    // AUTO_INCREMENT_DATA: function () {
    //     return {
    //         moduleName: this.MODULE_NAME,
    //         module: this.MODULE,
    //         company: null,
    //         modulePrefix: this.MODULE_PREFIX
    //     };
    // }
}
exports.FGIN_FOR_SFG = {
    COLLECTION_NAME: "FGINForSFG",
    ADDED_ACTION: "FGIN For SFG created",
    UPDATED_ACTION: "FGIN For SFG updated",
    MODULE_NAME: "FGIN For SFG",
    MODULE: "FGINForSFG",
    MODULE_PREFIX: "FGS/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
}