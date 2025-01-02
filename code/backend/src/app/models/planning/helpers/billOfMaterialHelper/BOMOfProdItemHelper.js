exports.getAllBOMOfProdItemAttributes = () => {
    return {
        BOMNo: {
            $ifNull: ["$BOMOfProdItem.BOMNo", {$concat: ["$prodItemCategoryInfo.BOMPrefix", "$itemCode"]}]
        },
        inkMaster: {$ifNull: ["$prodItemCategoryInfo.inkMaster", false]},
        itemCode: 1,
        itemName: 1,
        itemDescription: 1,
        prodItemCategory: 1,
        UOM: "$unitOfMeasurement",
        partCount: "$BOMOfProdItem.partCount",
        totalMaterialCost: "$BOMOfProdItem.totalMaterialCost",
        status: 1,
        createdAt: 1,
        revisionHistory: "$BOMOfProdItem.revisionHistory",
        revisionNo: {$concat: ["Rev", " ", {$toString: {$ifNull: ["$BOMOfProdItem.revisionNo", 0]}}]}
    };
};
