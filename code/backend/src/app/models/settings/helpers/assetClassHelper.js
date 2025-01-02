exports.getAllAssetClassAttributes = () => {
    return {
        order: 1,
        assetClassName: 1,
        prefix: 1,
        nextAutoIncrement: 1,
        depreciation: {$cond: ["$depreciation", "Yes", "No"]},
        energySpecification: {$cond: ["$energySpecification", "Yes", "No"]},
        type: 1,
        createdAt: 1
    };
};
