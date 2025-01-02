exports.getAllSKUCostingAttributes = () => {
    return {
        SKUCode: 1,
        BOMCode: 1,
        BOMDescription: 1,
        SKUName: 1,
        SKUDescription: 1,
        status: 1,
        createdAt: 1,
        totalBomCost: 1,
        totalRoutingCost: 1,
        SKUCost: 1
    };
};
exports.getAllSKUCostingExcelAttributes = () => {
    return {
        costingCode: 1,
        costingDateS: {$dateToString: {format: "%d-%m-%Y", date: "$costingDate"}},
        costingDescription: 1,
        revision: 1,
        SKUCode: 1,
        SKUName: 1,
        SKUDescription: 1,
        UoM: 1,
        BOMCode: 1,
        BOMDescription: 1,
        status: 1,
        createdAt: 1,
        totalBomCost: 1,
        totalRoutingCost: 1,
        SKUCost: 1
    };
};
