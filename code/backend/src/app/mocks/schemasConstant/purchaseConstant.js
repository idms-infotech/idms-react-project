exports.CAPITAL_GOODS_CGM = {
    COLLECTION_NAME: "CapitalGoods",
    ADDED_ACTION: "Capital Goods Master created",
    UPDATED_ACTION: "Capital Goods Master updated",
    MODULE_NAME: "CapitalGoods",
    MODULE: "CG",
    MODULE_PREFIX: "CG",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.DEBIT_NOTE = {
    COLLECTION_NAME: "DebitNote",
    ADDED_ACTION: "Debit Note Master created",
    UPDATED_ACTION: "Debit Note Master updated",
    MODULE_NAME: "Debit Note",
    MODULE: "DEBIT",
    MODULE_PREFIX: "DN/23-24/",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};

exports.EXTERNAL_SERVICE_PROVIDER = {
    COLLECTION_NAME: "ExternalServiceProvider",
    ADDED_ACTION: "External Service Provider Master created",
    UPDATED_ACTION: "External Service Provider Master updated",
    MODULE_NAME: "External Service Provider",
    MODULE: "ExternalServiceProvider"
};
exports.PURCHASE_HSN = {
    COLLECTION_NAME: "HSN",
    ADDED_ACTION: "Purchase HSN Master created",
    UPDATED_ACTION: "Purchase HSN Master updated",
    MODULE_NAME: "HSN",
    MODULE: "HSN",
    MODULE_PREFIX: "HSN",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};

exports.ITEM_CATEGORY = {
    COLLECTION_NAME: "ItemCategory",
    ADDED_ACTION: "Item Category create",
    UPDATED_ACTION: "Item Category updated",
    MODULE_NAME: "Item Category",
    MODULE: "ItemCategory"
    // MODULE_PREFIX: "CG",
    // AUTO_INCREMENT_DATA: function () {
    //     return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    // }
};
exports.ITEMS = {
    COLLECTION_NAME: "Items",
    ADDED_ACTION: "Item Master created",
    UPDATED_ACTION: "Item Master updated",
    MODULE_NAME: "Items",
    MODULE: "Items"
};
exports.PURCHASE_ORDER = {
    COLLECTION_NAME: "PurchaseOrder",
    ADDED_ACTION: "Purchase Order created",
    UPDATED_ACTION: "Purchase Order updated",
    MODULE_NAME: "Purchase Order",
    MODULE: "PO",
    MODULE_PREFIX: "PO",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.PURCHASE_SAC = {
    COLLECTION_NAME: "SAC",
    ADDED_ACTION: "SAC Master created",
    UPDATED_ACTION: "SAC Master updated",
    MODULE_NAME: "SAC",
    MODULE: "SAC",
    MODULE_PREFIX: "SAC",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.PURCHASE_SERVICE_MASTER = {
    COLLECTION_NAME: "ServiceMaster",
    ADDED_ACTION: "Service Master created",
    UPDATED_ACTION: "Service Master updated",
    MODULE_NAME: "Service Master",
    MODULE: "SER",
    MODULE_PREFIX: "SER",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.SERVICE_PURCHASE_ORDER = {
    COLLECTION_NAME: "ServicePurchaseOrder",
    ADDED_ACTION: "Service Purchase Order created",
    UPDATED_ACTION: "Service Purchase Order updated",
    MODULE_NAME: "Service Purchase Order",
    MODULE: "SPO",
    MODULE_PREFIX: "SPO",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.SUPPLIER = {
    COLLECTION_NAME: "Supplier",
    ADDED_ACTION: "Supplier Master created",
    UPDATED_ACTION: "Supplier Master updated",
    MODULE_NAME: "Supplier",
    MODULE: "SUPPLIER",
    MODULE_PREFIX: "S",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.SUPPLIER_RULE = {
    COLLECTION_NAME: "SupplierRule",
    ADDED_ACTION: "Supplier Rule created",
    UPDATED_ACTION: "Supplier Rule updated",
    MODULE_NAME: "Supplier Rule",
    MODULE: "SupplierRule"
    // MODULE_PREFIX: "CG",
    // AUTO_INCREMENT_DATA: function () {
    //     return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    // }
};

exports.CHANNEL_PARTNER = {
    COLLECTION_NAME: "ChannelPartner",
    ADDED_ACTION: "Channel Partner created",
    UPDATED_ACTION: "Channel Partner updated",
    MODULE_NAME: "Channel Partner",
    MODULE: "ChannelPartner",
    MODULE_PREFIX: "CP/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
}
exports.PURCHASE_INDENT = {
    COLLECTION_NAME: "PurchaseIndent",
    ADDED_ACTION: "Purchase Indent created",
    UPDATED_ACTION: "Purchase Indent updated",
    MODULE_NAME: "Purchase Indent",
    MODULE: "PurchaseIndent",
    MODULE_PREFIX: "PI/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
}
exports.JOB_WORKER_MASTER = {
    COLLECTION_NAME: "JobWorkerMaster",
    ADDED_ACTION: "Job Worker Master created",
    UPDATED_ACTION: "Job Worker Master updated",
    MODULE_NAME: "Job Worker Master",
    MODULE: "JobWorkerMaster",
    MODULE_PREFIX: "JW/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
}
exports.JOB_WORK_ITEM_MASTER = {
    COLLECTION_NAME: "JobWorkItemMaster",
    ADDED_ACTION: "Job Work Item Master created",
    UPDATED_ACTION: "Job Work Item Master updated",
    MODULE_NAME: "Job Work Item Master",
    MODULE: "JobWorkItemMaster",
    MODULE_PREFIX: "JWI/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
}
exports.JOB_WORK_CHALLAN = {
    COLLECTION_NAME: "JobWorkChallan",
    ADDED_ACTION: "Job Work Challan created",
    UPDATED_ACTION: "Job Work Challan updated",
    MODULE_NAME: "Job Work Challan",
    MODULE: "JobWorkChallan",
    MODULE_PREFIX: "JWC/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
}
exports.JOB_WORK_ORDER = {
    COLLECTION_NAME: "JobWorkOrder",
    ADDED_ACTION: "Job Work Order created",
    UPDATED_ACTION: "Job Work Order updated",
    MODULE_NAME: "Job Work Order",
    MODULE: "JobWorkOrder",
    MODULE_PREFIX: "JWO/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
}
exports.PROSPECT_SUPPLIER = {
    COLLECTION_NAME: "ProspectSupplier",
    ADDED_ACTION: "Reason For CN created",
    UPDATED_ACTION: "Reason For CN updated",
    MODULE_NAME: "Reason For CN",
    MODULE: "ProspectSupplier",
    MODULE_PREFIX: "VRN/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
}
exports.DELIVERY_CHALLAN = {
    COLLECTION_NAME: "DeliveryChallan",
    ADDED_ACTION: "Delivery Challan created",
    UPDATED_ACTION: "Delivery Challan updated",
    // MODULE_NAME: "Delivery Challan",
    // MODULE: "DeliveryChallan",
    // MODULE_PREFIX: "DC/",
    // AUTO_INCREMENT_DATA: function () {
    //     return {
    //         moduleName: this.MODULE_NAME,
    //         module: this.MODULE,
    //         company: null,
    //         modulePrefix: this.MODULE_PREFIX
    //     };
    // }
}