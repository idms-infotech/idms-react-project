exports.getAllBOMOfSKUAttributes = () => {
    return {
        _id: 1,
        SKUCode: "$SKUNo",
        SKUName: 1,
        SKUDescription: 1,
        UOM: "$primaryUnit",
        productCategory: 1,
        revisionNo: 1,
        status: "$BOMStatus",
        totalMaterialCost: 1,
        BOMNo: {$replaceOne: {input: "$SKUNo", find: "$SKUCategoryPrefix", replacement: "$BOMPrefix"}}
    };
};
exports.getSKUListForBOMAttributes = BOMPrefix => {
    return {
        _id: 1,
        SKUNo: 1,
        SKUName: 1,
        SKUDescription: 1,
        primaryUnit: 1,
        productCategory: 1,
        revisionNo: 1,
        status: "$BOMStatus",
        SKUCategoryPrefix: 1,
        totalMaterialCost: "$BOMOfSKU.totalMaterialCost",
        revisionHistory: "$BOMOfSKU.revisionHistory",
        BOMNo: {$replaceOne: {input: "$SKUNo", find: "$SKUCategoryPrefix", replacement: "$BOMPrefix"}}
    };
};
exports.getAllReportsAttributes = BOMPrefix => {
    return {
        SKUNo: 1,
        artWorkNo: 1,
        SKUName: 1,
        SKUDescription: 1,
        primaryUnit: 1,
        revisionNo: 1,
        status: 1,
        productCategory: 1,
        BOMNo: "$BOMOfSKU.BOMNo"
    };
};
