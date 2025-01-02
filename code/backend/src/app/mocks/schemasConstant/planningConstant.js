exports.JOB_CARD_CREATION = {
    COLLECTION_NAME: "JobCardCreation",
    ADDED_ACTION: "Job Card Creation created",
    UPDATED_ACTION: "Job Card Creation updated",
    MODULE_NAME: "Job Card Creation",
    MODULE: "JobCardCreation",
    MODULE_PREFIX: "JC/",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.BILL_OF_MATERIAL = {
    COLLECTION_NAME: "BillingOfMaterial",
    ADDED_ACTION: "Bill of Material Master created",
    UPDATED_ACTION: "Bill of Material Master updated",
    MODULE_NAME: "Billing Of Material",
    MODULE: "BOM",
    MODULE_PREFIX: "BOM",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.PROD_ITEM_MASTER = {
    COLLECTION_NAME: "ProductionItem",
    ADDED_ACTION: "Production Item Master created",
    UPDATED_ACTION: "Production Item Master updated",
    // MODULE_NAME: "",
    MODULE: "ProductionItem",
    MODULE_PREFIX: ""
    // AUTO_INCREMENT_DATA: function () {
    //     return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    // }
};
exports.DIRECT_COST = {
    COLLECTION_NAME: "DirectCost",
    ADDED_ACTION: "Direct Cost created",
    UPDATED_ACTION: "Direct Cost updated",
    MODULE_NAME: "Direct Cost",
    MODULE: "DC/",
    MODULE_PREFIX: "DC/",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.PROCESS_MASTER = {
    COLLECTION_NAME: "ProcessMaster",
    ADDED_ACTION: "Process Master created",
    UPDATED_ACTION: "Process Master updated",
    MODULE_NAME: "Process Master",
    MODULE: "P/",
    MODULE_PREFIX: "P/",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.PROCESS_RESOURCE_MANAGEMENT = {
    COLLECTION_NAME: "ProcessResourceManagement",
    ADDED_ACTION: "Process Resource management created",
    UPDATED_ACTION: "Process Resource management updated",
    MODULE_NAME: "Process Resource Management",
    MODULE: "PRM",
    MODULE_PREFIX: "PRM",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.PRODUCT_MASTER = {
    COLLECTION_NAME: "ProductMaster",
    ADDED_ACTION: "Product Master created",
    UPDATED_ACTION: "Product Master updated",
    MODULE_NAME: "Product Master",
    MODULE: "ST/",
    MODULE_PREFIX: "ST/",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.ROUTING_MASTER = {
    COLLECTION_NAME: "RoutingMaster",
    ADDED_ACTION: "Routing  Master created",
    UPDATED_ACTION: "Routing Master updated",
    MODULE_NAME: "Routing Master",
    MODULE: "RM",
    MODULE_PREFIX: "RM",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.SFG_STOCK = {
    COLLECTION_NAME: "SFGStock",
    ADDED_ACTION: "Planning SFG Stock created",
    UPDATED_ACTION: "Planning SFG Stock updated",
    MODULE_NAME: "SFG Stock",
    MODULE: "SFG",
    MODULE_PREFIX: "SFG",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.SKU_COSTING = {
    COLLECTION_NAME: "SKUCosting",
    ADDED_ACTION: "SKU Costing Master created",
    UPDATED_ACTION: "SKU Costing Master updated",
    MODULE_NAME: "SKU Costing",
    MODULE: "SCO",
    MODULE_PREFIX: "SCO",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.SKU_COST_SHEET = {
    COLLECTION_NAME: "SKUCostSheet",
    ADDED_ACTION: "SKU Cost Sheet created",
    UPDATED_ACTION: "SKU Cost Sheet updated",
    MODULE_NAME: "SKU Cost Sheet",
    MODULE: "SKU-CS",
    MODULE_PREFIX: "SKU-CS",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.STOCK_ISSUE_TO_PRODUCTION = {
    COLLECTION_NAME: "StockIssueToProduction",
    ADDED_ACTION: "Planning Stock Issue created",
    UPDATED_ACTION: "Planning Stock Issue updated",
    MODULE_NAME: "Stock Issue",
    MODULE: "SIP",
    MODULE_PREFIX: "SIP",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.STOCK_TRANSFER_TO_STORE = {
    COLLECTION_NAME: "StockTransferToStores",
    ADDED_ACTION: "Planning Stock Transfer to Store created",
    UPDATED_ACTION: "Planning Stock Transfer to Store updated",
    MODULE_NAME: "Stock Transfer To Stores",
    MODULE: "STS",
    MODULE_PREFIX: "STS/",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.WIP_INVENTORY = {
    COLLECTION_NAME: "WIPInventory",
    ADDED_ACTION: "Planning Stock Transfer to Store created",
    UPDATED_ACTION: "Planning Stock Transfer to Store updated",
    // MODULE_NAME: "",
    MODULE: "WIPInventory"
    // MODULE_PREFIX: "",
    // AUTO_INCREMENT_DATA: function () {
    //     return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    // }
};
exports.BOM_OF_PROD_ITEM = {
    COLLECTION_NAME: "BOMOfProdItem",
    ADDED_ACTION: "BOM Of Prod Item created",
    UPDATED_ACTION: "BOM Of Prod Item updated",
    MODULE_NAME: "BOM Of Prod Item",
    MODULE: "BOMOfProdItem",
    MODULE_PREFIX: "BOMPI",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};

exports.BOM_OF_PRODUCT = {
    COLLECTION_NAME: "BoMOfProduct",
    ADDED_ACTION: "BoM Of Product created",
    UPDATED_ACTION: "BoM Of Product updated",
    MODULE_NAME: "BoM Of Product",
    MODULE: "B10/",
    MODULE_PREFIX: "B10/",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.BOM_OF_SKU = {
    COLLECTION_NAME: "BoMOfSKU",
    ADDED_ACTION: "BoM Of SKU created",
    UPDATED_ACTION: "BoM Of SKU updated",
    MODULE_NAME: "BoM Of SKU",
    MODULE: "BOMS",
    MODULE_PREFIX: "BOMS",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};

exports.GOODS_ISSUE_PPIC_TO_PRODUCTION = {
    COLLECTION_NAME: "GoodsIssuePPICToProduction",
    ADDED_ACTION: "Goods Issue PPIC To Production created",
    UPDATED_ACTION: "Goods Issue PPIC To Production updated",
    MODULE_NAME: "Goods Issue PPIC To Production",
    MODULE: "GoodsIssuePPICToProduction",
    MODULE_PREFIX: "GI/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};
exports.GOODS_TRANSFER_REQUEST = {
    COLLECTION_NAME: "GoodsTransferRequest",
    ADDED_ACTION: "Goods Transfer Request created",
    UPDATED_ACTION: "Goods Transfer Request updated",
    MODULE_NAME: "Goods Transfer Request",
    MODULE: "GoodsTransferRequest",
    MODULE_PREFIX: "GTR/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};
exports.STOCK_PREPARATION = {
    COLLECTION_NAME: "StockPreparation",
    ADDED_ACTION: "Stock Preparation created",
    UPDATED_ACTION: "Stock Preparation updated"
    // MODULE_NAME: "Stock Preparation",
    // MODULE: "StockPreparation",
    // MODULE_PREFIX: "null",
    // AUTO_INCREMENT_DATA: function () {
    //     return {
    //         moduleName: this.MODULE_NAME,
    //         module: this.MODULE,
    //         company: null,
    //         modulePrefix: this.MODULE_PREFIX
    //     };
    // }
};
exports.BOM_OF_JOB_WORK_ITEM = {
    COLLECTION_NAME: "BOMOfJobWorkItem",
    ADDED_ACTION: "BoM Of Job Work Item created",
    UPDATED_ACTION: "BoM Of Job Work Item updated",
    MODULE_NAME: "BoM Of Job Work Item",
    MODULE: "BOMOfJobWorkItem",
    MODULE_PREFIX: "BOM/JWI/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};

exports.JW_PRINCIPAL = {
    COLLECTION_NAME: "JWPrincipal",
    ADDED_ACTION: "JW Principal created",
    UPDATED_ACTION: "JW Principal updated",
    MODULE_NAME: "JW Principal",
    MODULE: "JWPrincipal",
    MODULE_PREFIX: "JP/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};
exports.PLANNING_ITEM_MASTER = {
    COLLECTION_NAME: "PlanningItemMaster",
    ADDED_ACTION: "Item Master (JP09) created",
    UPDATED_ACTION: "Item Master (JP09) updated"
    // MODULE_NAME: "Item Master (JP09)",
    // MODULE: "PlanningItemMaster",
    // MODULE_PREFIX: "JP09/",
    // AUTO_INCREMENT_DATA: function () {
    //     return {
    //         moduleName: this.MODULE_NAME,
    //         module: this.MODULE,
    //         company: null,
    //         modulePrefix: this.MODULE_PREFIX
    //     };
    // }
};

exports.SKU_MASTER_JP15 = {
    COLLECTION_NAME: "SKUMasterJP15",
    ADDED_ACTION: "SKU Master JP15 created",
    UPDATED_ACTION: "SKU Master JP15 updated",
    MODULE_NAME: "SKU Master JP15",
    MODULE: "SKUMasterJP15",
    MODULE_PREFIX: "JP15",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};

exports.BOM_JP15 = {
    COLLECTION_NAME: "BoMJP15",
    ADDED_ACTION: "Bill Of Material JP15 created",
    UPDATED_ACTION: "Bill Of Material JP15 updated",
    MODULE_NAME: "Bill Of Material JP15",
    MODULE: "BoMJP15",
    MODULE_PREFIX: "B20/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};

exports.LOGISTICS_PROVIDER = {
    COLLECTION_NAME: "LogisticsProvider",
    ADDED_ACTION: "Logistics Provider created",
    UPDATED_ACTION: "Logistics Provider updated",
    MODULE_NAME: "Logistics Provider",
    MODULE: "LogisticsProvider",
    MODULE_PREFIX: "LSP/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};
exports.PRODUCTION_UNIT_CONFIG = {
    COLLECTION_NAME: "ProductionUnitConfig",
    ADDED_ACTION: "Production Unit Config created",
    UPDATED_ACTION: "Production Unit Config updated"
    // MODULE_NAME: "Production Unit Config",
    // MODULE: "ProductionUnitConfig",
    // MODULE_PREFIX: "null",
    // AUTO_INCREMENT_DATA: function () {
    //     return {
    //         moduleName: this.MODULE_NAME,
    //         module: this.MODULE,
    //         company: null,
    //         modulePrefix: this.MODULE_PREFIX
    //     };
    // }
};

exports.INV_ZONE_CONFIG = {
    COLLECTION_NAME: "InvZoneConfig",
    ADDED_ACTION: "Inv Zone Config created",
    UPDATED_ACTION: "Inv Zone Config updated"
    // MODULE_NAME: "Inv Zone Config",
    // MODULE: "InvZoneConfig",
    // MODULE_PREFIX: "null",
    // AUTO_INCREMENT_DATA: function () {
    //     return {
    //         moduleName: this.MODULE_NAME,
    //         module: this.MODULE,
    //         company: null,
    //         modulePrefix: this.MODULE_PREFIX
    //     };
    // }
};

exports.PROD_PROCESS_CONFIG = {
    COLLECTION_NAME: "ProdProcessConfig",
    ADDED_ACTION: "Prod Process Config created",
    UPDATED_ACTION: "Prod Process Config updated"
    // MODULE_NAME: "Prod Process Config",
    // MODULE: "ProdProcessConfig",
    // MODULE_PREFIX: "null",
    // AUTO_INCREMENT_DATA: function () {
    //     return {
    //         moduleName: this.MODULE_NAME,
    //         module: this.MODULE,
    //         company: null,
    //         modulePrefix: this.MODULE_PREFIX
    //     };
    // }
};
exports.BOM_OF_SFG_MASTER = {
    COLLECTION_NAME: "BOMOfSFGMaster",
    ADDED_ACTION: "BOM Of SFGMaster created",
    UPDATED_ACTION: "BOM Of SFGMaster updated"
    // MODULE_NAME: "BOM Of SFGMaster",
    // MODULE: "BOMOfSFGMaster",
    // MODULE_PREFIX: "null",
    // AUTO_INCREMENT_DATA: function () {
    //     return {
    //         moduleName: this.MODULE_NAME,
    //         module: this.MODULE,
    //         company: null,
    //         modulePrefix: this.MODULE_PREFIX
    //     };
    // }
};
exports.JWI_ITEM_STD_COST = {
    COLLECTION_NAME: "JWIItemStdCost",
    ADDED_ACTION: "JWI Item Std Cost created",
    UPDATED_ACTION: "JWI Item Std Cost updated"
    // MODULE_NAME: "JWI Item Std Cost",
    // MODULE: "JWIItemStdCost",
    // MODULE_PREFIX: "null",
    // AUTO_INCREMENT_DATA: function () {
    //     return {
    //         moduleName: this.MODULE_NAME,
    //         module: this.MODULE,
    //         company: null,
    //         modulePrefix: this.MODULE_PREFIX
    //     };
    // }
};
exports.PROD_ITEM_STD_COST = {
    COLLECTION_NAME: "ProdItemStdCost",
    ADDED_ACTION: "Prod Item Std Cost created",
    UPDATED_ACTION: "Prod Item Std Cost updated"
    // MODULE_NAME: "Prod Item Std Cost",
    // MODULE: "ChildItemStdCost",
    // MODULE_PREFIX: "null",
    // AUTO_INCREMENT_DATA: function () {
    //     return {
    //         moduleName: this.MODULE_NAME,
    //         module: this.MODULE,
    //         company: null,
    //         modulePrefix: this.MODULE_PREFIX
    //     };
    // }
};

exports.SFG_MASTER_STD_COST = {
    COLLECTION_NAME: "SFGMasterStdCost",
    ADDED_ACTION: "SFG Master Std Cost created",
    UPDATED_ACTION: "SFG Master Std Cost updated"
    // MODULE_NAME: "SFG Master Std Cost",
    // MODULE: "SFGMasterStdCost",
    // MODULE_PREFIX: "null",
    // AUTO_INCREMENT_DATA: function () {
    //     return {
    //         moduleName: this.MODULE_NAME,
    //         module: this.MODULE,
    //         company: null,
    //         modulePrefix: this.MODULE_PREFIX
    //     };
    // }
};
exports.PROD_PROCESS_FLOW = {
    COLLECTION_NAME: "ProdProcessFlow",
    ADDED_ACTION: "Prod Process Flow created",
    UPDATED_ACTION: "Prod Process Flow updated"
    // MODULE_NAME: "Prod Process Flow",
    // MODULE: "ProdProcessFlow",
    // MODULE_PREFIX: "null",
    // AUTO_INCREMENT_DATA: function () {
    //     return {
    //         moduleName: this.MODULE_NAME,
    //         module: this.MODULE,
    //         company: null,
    //         modulePrefix: this.MODULE_PREFIX
    //     };
    // }
};
exports.BATCH_CARD = {
    COLLECTION_NAME: "BatchCard",
    ADDED_ACTION: "Batch Card created",
    UPDATED_ACTION: "Batch Card updated"
    // MODULE_NAME: "Batch Card",
    // MODULE: "BatchCard",
    // MODULE_PREFIX: "null",
    // AUTO_INCREMENT_DATA: function () {
    //     return {
    //         moduleName: this.MODULE_NAME,
    //         module: this.MODULE,
    //         company: null,
    //         modulePrefix: this.MODULE_PREFIX
    //     };
    // }
};

exports.BOM_OF_KIT = {
    COLLECTION_NAME: "BOMOfKIT",
    ADDED_ACTION: "BOM Of KIT created",
    UPDATED_ACTION: "BOM Of KIT updated",
    MODULE_NAME: "BOM Of KIT",
    MODULE: "BOMOfKIT",
    MODULE_PREFIX: "BKIT/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};

exports.PACKING_STANDARD = {
    COLLECTION_NAME: "PackingStandard",
    ADDED_ACTION: "Packing Standard created",
    UPDATED_ACTION: "Packing Standard updated",
    // MODULE_NAME: "Packing Standard",
    // MODULE: "PackingStandard",
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