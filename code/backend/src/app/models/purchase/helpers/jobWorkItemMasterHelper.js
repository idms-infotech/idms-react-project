exports.getAllJobWorkItemMasterAttributes = () => {
    return {
        jobWorkItemCode: 1,
        jobWorkItemName: 1,
        jobWorkItemDescription: 1,
        orderInfoUOM: 1,
        HSNCode: 1,
        BOMLevel: 1,
        conversionOfUnits: 1,
        shelfLife: 1,
        QCLevels: 1,
        status: 1,
        primaryUnit: 1,
        secondaryUnit: 1,
        STDBatchQuantity: 1
    };
};

exports.getAllJWItemForStockLevelAttributes = () => {
    return {
        jobWorkItemCode: 1,
        jobWorkItemName: 1,
        jobWorkItemDescription: 1,
        conversionOfUnits: 1,
        orderInfoUOM: 1,
        primaryUnit: 1,
        secondaryUnit: 1,
        // itemROL: 1,
        // itemAMU: 1,
        reorderLevel: "$JWItemStockLevels.reorderLevel",
        // reorderQty: "$JWItemStockLevels.reorderQty",
        minLevel: "$JWItemStockLevels.minLevel",
        maxLevel: "$JWItemStockLevels.maxLevel",
        JWItemStockLevels: 1,
        status: 1
    };
};

exports.getAllForHSNAttributes = () => {
    return {
        jobWorkItemCode: 1,
        jobWorkItemName: 1,
        jobWorkItemDescription: 1,
        itemCategory: 1,
        orderInfoUOM: 1,
        HSNCode: {$ifNull: ["$HSNCode", null]},
        HSN: 1,
        HSNStatus: 1,
        revisionHistory: 1,
        revisionInfo: 1
    };
};
