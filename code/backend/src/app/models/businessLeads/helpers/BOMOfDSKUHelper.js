exports.getAllBOMOfSKUAttributes = extra => {
    return {
        BOMNo: 1,
        SKUCode: 1,
        SKUName: 1,
        SKUDescription: 1,
        UOM: 1,
        partCount: 1,
        totalMaterialCost: 1,
        status: 1,
        ...extra
    };
};
