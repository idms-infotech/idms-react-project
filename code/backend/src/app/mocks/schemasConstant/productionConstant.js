exports.CHILD_PART_PRODUCTION = {
    COLLECTION_NAME: "ChildPartProduction",
    ADDED_ACTION: "Child Part Production created",
    UPDATED_ACTION: "Child Part Production updated",
    MODULE_NAME: "Child Part Production",
    MODULE: "CPP",
    MODULE_PREFIX: "CPP",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.FG_CORRECTION = {
    COLLECTION_NAME: "FGCorrection",
    ADDED_ACTION: "Production FG Correction created",
    UPDATED_ACTION: "Production FG Correction updated",
    MODULE_NAME: "FG Correction",
    MODULE: "FG",
    MODULE_PREFIX: "FG",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.GOODS_REQUISITION = {
    COLLECTION_NAME: "GoodsRequisition",
    ADDED_ACTION: "Production Good Requisition created",
    UPDATED_ACTION: "Production Good Requisition updated",
    MODULE_NAME: "Goods Requisition",
    MODULE: "GR",
    MODULE_PREFIX: "GR",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.GROUP_PART_PRODUCTION = {
    COLLECTION_NAME: "GrandPartProduction",
    ADDED_ACTION: "Group Part Production created",
    UPDATED_ACTION: "Group Part Production updated",
    MODULE_NAME: "Group Part Production",
    MODULE: "GPP",
    MODULE_PREFIX: "GPP",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.INK_MASTER = {
    COLLECTION_NAME: "InkMaster",
    ADDED_ACTION: "Ink Master created",
    UPDATED_ACTION: "Ink Master updated",
    MODULE_NAME: "Ink Master",
    MODULE: "INKM",
    MODULE_PREFIX: "INKM",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.MAP_PROCESS_AND_MACHINE = {
    COLLECTION_NAME: "MapProcessAndMachine",
    ADDED_ACTION: "Map Process And Machine created",
    UPDATED_ACTION: "Map Process And Machine updated",
    MODULE_NAME: "Map Process And Machine",
    MODULE: "MP/",
    MODULE_PREFIX: "MP/",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.SKU_PART_PRODUCTION = {
    COLLECTION_NAME: "SKUPartProduction",
    ADDED_ACTION: "SKU Part Production created",
    UPDATED_ACTION: "SKU Part Production updated",
    MODULE_NAME: "SKU Part Production",
    MODULE: "SKUPP",
    MODULE_PREFIX: "SKUPP",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};

exports.JOB_CARD_OUTPUT = {
    COLLECTION_NAME: "JobCardOutput",
    ADDED_ACTION: "Job Card Output created",
    UPDATED_ACTION: "Job Card Output updated",
    MODULE_NAME: "Job Card Output",
    MODULE: "JobCardOutput",
    MODULE_PREFIX: "JCO/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};
exports.INK_MIXING = {
    COLLECTION_NAME: "InkMixing",
    ADDED_ACTION: "Ink Mixing created",
    UPDATED_ACTION: "Ink Mixing updated",
    MODULE_NAME: "Ink Mixing",
    MODULE: "InkMixing",
    MODULE_PREFIX: "IM/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};
exports.JOB_CARD_ENTRY = {
    COLLECTION_NAME: "JobCardEntry",
    ADDED_ACTION: "Job Card Entry created",
    UPDATED_ACTION: "Job Card Entry updated",
    MODULE_NAME: "Job Card Entry",
    MODULE: "JobCardEntry",
    MODULE_PREFIX: "JCE/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};
exports.JC_ENTRY = {
    COLLECTION_NAME: "JCEntry",
    ADDED_ACTION: "JC Entry created",
    UPDATED_ACTION: "JC Entry updated",
    MODULE_NAME: "JC Entry",
    MODULE: "JCEntry",
    MODULE_PREFIX: "JCE/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};
exports.SCREEN_MAKING_LOG = {
    COLLECTION_NAME: "ScreenMakingLog",
    ADDED_ACTION: "Screen Making Log created",
    UPDATED_ACTION: "Screen Making Log updated"
    // MODULE_NAME: "Screen Making Log",
    // MODULE: "ScreenMakingLog",
    // MODULE_PREFIX: "SM/",
    // AUTO_INCREMENT_DATA: function () {
    //     return {
    //         moduleName: this.MODULE_NAME,
    //         module: this.MODULE,
    //         company: null,
    //         modulePrefix: this.MODULE_PREFIX
    //     };
    // }
};
exports.INK_MIXING_LOG = {
    COLLECTION_NAME: "InkMixingLog",
    ADDED_ACTION: "Ink Mixing Log created",
    UPDATED_ACTION: "Ink Mixing Log updated",
    MODULE_NAME: "Ink Mixing Log",
    MODULE: "InkMixingLog",
    MODULE_PREFIX: "null",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};
exports.STOCK_CUTTING = {
    COLLECTION_NAME: "StockCutting",
    ADDED_ACTION: "Stock Cutting created",
    UPDATED_ACTION: "Stock Cutting updated"
    // MODULE_NAME: "Stock Cutting",
    // MODULE: "StockCutting",
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

exports.SCREEN_PRINTING_LOG = {
    COLLECTION_NAME: "ScreenPrintingLog",
    ADDED_ACTION: "Screen Printing Log created",
    UPDATED_ACTION: "Screen Printing Log updated"
    // MODULE_NAME: "Screen Printing Log",
    // MODULE: "ScreenPrintingLog",
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
exports.LAMINATION = {
    COLLECTION_NAME: "Lamination",
    ADDED_ACTION: "Lamination created",
    UPDATED_ACTION: "Lamination updated",
    MODULE_NAME: "Lamination",
    MODULE: "Lamination",
    MODULE_PREFIX: "null",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};
exports.WEEDING = {
    COLLECTION_NAME: "Weeding",
    ADDED_ACTION: "Weeding created",
    UPDATED_ACTION: "Weeding updated",
    MODULE_NAME: "Weeding",
    MODULE: "Weeding",
    MODULE_PREFIX: "null",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};
exports.PACKING = {
    COLLECTION_NAME: "Packing",
    ADDED_ACTION: "Packing created",
    UPDATED_ACTION: "Packing updated",
    MODULE_NAME: "Packing",
    MODULE: "Packing",
    MODULE_PREFIX: "null",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};
exports.THROUGH_PUNCHING = {
    COLLECTION_NAME: "ThroughPunching",
    ADDED_ACTION: "ThroughPunching created",
    UPDATED_ACTION: "ThroughPunching updated",
    MODULE_NAME: "ThroughPunching",
    MODULE: "ThroughPunching",
    MODULE_PREFIX: "null",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};

exports.STAGE_INSPECTION = {
    COLLECTION_NAME: "StageInspection",
    ADDED_ACTION: "Stage Inspection created",
    UPDATED_ACTION: "Stage Inspection updated"
    // MODULE_NAME: "Stage Inspection",
    // MODULE: "StageInspection",
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

exports.STAGE_INSPECTION_IPQA = {
    COLLECTION_NAME: "StageInspectionIPQA",
    ADDED_ACTION: "Stage Inspection IPQA created",
    UPDATED_ACTION: "Stage Inspection IPQA updated"
    // MODULE_NAME: "Stage Inspection IPQA",
    // MODULE: "StageInspectionIPQA",
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
exports.INK_MIXING_IPQA = {
    COLLECTION_NAME: "InkMixingLogIPQA",
    ADDED_ACTION: "Ink Mixing Log IPQA created",
    UPDATED_ACTION: "Ink Mixing Log IPQA updated"
    // MODULE_NAME: "Ink Mixing Log IPQA",
    // MODULE: "InkMixingLogIPQA",
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
exports.SCREEN_MAKING_IPQA = {
    COLLECTION_NAME: "ScreenMakingLogIPQA",
    ADDED_ACTION: "Screen Making Log IPQA created",
    UPDATED_ACTION: "Screen Making Log IPQA updated"
    // MODULE_NAME: "Screen Making Log IPQA",
    // MODULE: "ScreenMakingLogIPQA",
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
exports.SCREEN_PRINTING_IPQA = {
    COLLECTION_NAME: "ScreenPrintingLogIPQA",
    ADDED_ACTION: "Screen Printing Log IPQA created",
    UPDATED_ACTION: "Screen Printing Log IPQA updated"
    // MODULE_NAME: "Screen Printing Log IPQA",
    // MODULE: "ScreenPrintingLogIPQA",
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
exports.LAMINATION_IPQA = {
    COLLECTION_NAME: "LaminationIPQA",
    ADDED_ACTION: "Lamination IPQA created",
    UPDATED_ACTION: "Lamination IPQA updated"
    // MODULE_NAME: "Lamination IPQA",
    // MODULE: "LaminationIPQA",
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
exports.PACKING_IPQA = {
    COLLECTION_NAME: "PackingIPQA",
    ADDED_ACTION: "Packing IPQA created",
    UPDATED_ACTION: "Packing IPQA updated"
    // MODULE_NAME: "Packing IPQA",
    // MODULE: "PackingIPQA",
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
exports.STOCK_CUTTING_IPQA = {
    COLLECTION_NAME: "StockCuttingIPQA",
    ADDED_ACTION: "StockCutting IPQA created",
    UPDATED_ACTION: "StockCutting IPQA updated"
    // MODULE_NAME: "StockCutting IPQA",
    // MODULE: "StockCuttingIPQA",
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
exports.THROUGH_PUNCHING_IPQA = {
    COLLECTION_NAME: "ThroughPunchingIPQA",
    ADDED_ACTION: "Through Punching IPQA created",
    UPDATED_ACTION: "Through Punching IPQA updated"
    // MODULE_NAME: "Through Punching IPQA",
    // MODULE: "ThroughPunchingIPQA",
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
exports.WEEDING_IPQA = {
    COLLECTION_NAME: "WeedingIPQA",
    ADDED_ACTION: "WEEDING IPQA created",
    UPDATED_ACTION: "WEEDING IPQA updated"
    // MODULE_NAME: "WEEDING IPQA",
    // MODULE: "WeedingIPQA",
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
exports.GENERIC_IPQA = {
    COLLECTION_NAME: "GenericIPQA",
    ADDED_ACTION: "Generic IPQA created",
    UPDATED_ACTION: "Generic IPQA updated"
    // MODULE_NAME: "WEEDING IPQA",
    // MODULE: "WeedingIPQA",
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
exports.GENERIC_BATCH_IPQA = {
    COLLECTION_NAME: "GenericBatchIPQA",
    ADDED_ACTION: "Generic IPQA created",
    UPDATED_ACTION: "Generic IPQA updated"
    // MODULE_NAME: "WEEDING IPQA",
    // MODULE: "WeedingIPQA",
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
exports.GENERIC_IPQC = {
    COLLECTION_NAME: "GenericIPQC",
    ADDED_ACTION: "Generic IPQC created",
    UPDATED_ACTION: "Generic IPQC updated"
    // MODULE_NAME: "WEEDING IPQA",
    // MODULE: "WeedingIPQA",
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

exports.GENERIC_PRODUCTION = {
    COLLECTION_NAME: "GenericProduction",
    ADDED_ACTION: "Generic Production created",
    UPDATED_ACTION: "Generic Production updated"
    // MODULE_NAME: "WEEDING IPQA",
    // MODULE: "WeedingIPQA",
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

exports.GENERIC_BATCH_PRODUCTION = {
    COLLECTION_NAME: "GenericBatchProduction",
    ADDED_ACTION: "Generic Batch Production created",
    UPDATED_ACTION: "Generic Batch Production updated"
    // MODULE_NAME: "WEEDING IPQA",
    // MODULE: "WeedingIPQA",
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
exports.BATCH_CARD_ENTRY = {
    COLLECTION_NAME: "BatchCardEntry",
    ADDED_ACTION: "Batch Card Entry created",
    UPDATED_ACTION: "Batch Card Entry updated",
    MODULE_NAME: "Batch Card Entry",
    MODULE: "BatchCardEntry",
    MODULE_PREFIX: "BCE/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};

exports.INTER_PROD_STORE = {
    COLLECTION_NAME: "InterProdStore",
    ADDED_ACTION: "Inter Prod Store created",
    UPDATED_ACTION: "Inter Prod Store updated"
    // MODULE_NAME: "Inter Prod Store",
    // MODULE: "InterProdStore",
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

exports.ENGG_SERVICE_REQUEST = {
    COLLECTION_NAME: "EnggServiceRequest",
    ADDED_ACTION: "Engg Service Request created",
    UPDATED_ACTION: "Engg Service Request updated",
    MODULE_NAME: "Engg Service Request",
    MODULE: "EnggServiceRequest",
    MODULE_PREFIX: "ESR/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};
exports.KIT_MASTER = {
    COLLECTION_NAME: "KITMaster",
    ADDED_ACTION: "KIT Master created",
    UPDATED_ACTION: "KIT Master updated",
    MODULE_NAME: "KIT Master",
    MODULE: "KITMaster",
    MODULE_PREFIX: "KIT/",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
};

exports.BC_INK_MIXING = {
    COLLECTION_NAME: "BCInkMixing",
    ADDED_ACTION: "BC Ink Mixing created",
    UPDATED_ACTION: "BC Ink Mixing updated",
    // MODULE_NAME: "BC Ink Mixing",
    // MODULE: "BCInkMixing",
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
exports.BC_PROD_LOG = {
    COLLECTION_NAME: "BCProdLog",
    ADDED_ACTION: "BC Prod log created",
    UPDATED_ACTION: "BC Prod log updated",
    MODULE_NAME: "BC Prod log",
    MODULE: "BCProdLog",
    MODULE_PREFIX: "null",
    AUTO_INCREMENT_DATA: function () {
        return {
            moduleName: this.MODULE_NAME,
            module: this.MODULE,
            company: null,
            modulePrefix: this.MODULE_PREFIX
        };
    }
}