exports.getAllAssetMasterAttributes = () => {
    return {
        assetCode: 1,
        assetName: 1,
        assetDescription: 1,
        assetPurchaseDateS: {$dateToString: {format: "%d-%m-%Y", date: "$assetPurchaseDate"}},
        createdAt: 1,
        totalAssetCostPerHr: 1,
        estimatedUsefulLifeInYear: "$costingInput.estimatedUsefulLifeInYear",
        status: 1,
        expiryDate: 1,
        assetOrigin: 1,
        location: 1,
        depreciationStartDateS: {$dateToString: {format: "%d-%m-%Y", date: "$depreciationStartDate"}},
        expiryStatus: {
            $cond: {
                if: {
                    $or: [
                        {$eq: ["$expiryDate", null]},
                        {$gte: ["$expiryDate", {$add: [new Date(), 600 * 24 * 60 * 60 * 1000]}]}
                    ]
                },
                then: "green",
                else: {
                    $cond: {
                        if: {
                            $gte: ["$expiryDate", new Date()]
                        },
                        then: "orange",
                        else: "red"
                    }
                }
            }
        }
    };
};
exports.getAllAssetMasterExcelAttributes = () => {
    return {
        assetCode: 1,
        assetName: 1,
        assetType: 1,
        assetDescription: 1,
        assetUniqueID: 1,
        assetOrigin: 1,
        assetPurchaseDateS: {$dateToString: {format: "%d-%m-%Y", date: "$assetPurchaseDate"}},
        assetPurchaseCost: 1,
        location: 1,
        depreciationStartDateS: {$dateToString: {format: "%d-%m-%Y", date: "$depreciationStartDate"}},
        status: 1,
        createdAt: 1,
        totalAssetCostPerHr: 1,
        estimatedUsefulLifeInYear: "$costingInput.estimatedUsefulLifeInYear"
    };
};
exports.getAllAssetMasterReportsAttributes = () => {
    return {
        assetCode: 1,
        assetName: 1,
        assetType: 1,
        manufacturer: 1,
        assetDescription: 1,
        createdAt: 1,
        createdAtS: 1
    };
};
