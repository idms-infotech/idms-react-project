exports.getAllProdItemMasterAttributes = () => {
    return {
        itemCode: 1,
        itemName: 1,
        itemDescription: 1,
        unitOfMeasurement: 1,
        prodItemCategory: 1,
        shelfLife: 1,
        status: 1,
        createdAt: 1,
        primaryUnit: 1,
        secondaryUnit: 1,
        conversionOfUnits: 1,
        inwardTo: 1,
        prodUnit: 1,
        STDBatchQty: 1
    };
};
exports.getAllProdItemMasterExcelAttributes = () => {
    return {
        prodItemCategory: 1,
        itemCode: 1,
        itemName: 1,
        itemDescription: 1,
        HSNCode: 1,
        unitOfMeasurement: 1,
        itemCost: 1,
        supplierName: "$supplierDetails.supplierName",
        supplierPartNo: "$supplierDetails.supplierPartNo",
        currency: "$supplierDetails.currency",
        purchaseCost: "$supplierDetails.purchaseCost",
        // extServiceProviderName: "$serviceProviderDetails.extServiceProviderName",
        // manufacturingCost: "$serviceProviderDetails.manufacturingCost",
        // paymentTerms: "$serviceProviderDetails.paymentTerms",
        shelfLife: 1,
        // storageTemp: 1,
        // storageHumidity: 1,
        // specialStorageInstruction: 1,
        status: 1,
        inwardTo: 1,
        prodUnit: 1,
        STDBatchQty: 1
    };
};

exports.getAllProdItemStockLevelsAttributes = () => {
    return {
        itemCode: 1,
        itemName: 1,
        itemDescription: 1,
        primaryUnit: 1,
        prodItemCategory: 1,
        status: 1,
        stockLevels: 1,
        reorderLevel: "$stockLevels.reorderLevel",
        minLevel: "$stockLevels.minLevel",
        maxLevel: "$stockLevels.maxLevel"
    };
};

exports.getAllForHSNAttributes = () => {
    return {
        itemCode: 1,
        itemName: 1,
        itemDescription: 1,
        unitOfMeasurement: 1,
        prodItemCategory: 1,
        HSNCode: {$ifNull: ["$HSNCode", null]},
        HSN: 1,
        HSNStatus: 1,
        revisionHistory: 1,
        revisionInfo: 1
    };
};
