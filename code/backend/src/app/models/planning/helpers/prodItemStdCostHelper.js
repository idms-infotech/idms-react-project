exports.getAllProdItemStdCostAttributes = () => {
    return {
        itemCode: 1,
        itemName: 1,
        itemDescription: 1,
        prodItemCategory: 1,
        unitOfMeasurement: 1,
        costSheetNo: {
            $ifNull: [
                "$prodItemStdCostInfo.costSheetNo",
                {$concat: ["$childItemCategoryInfo.costSheetPrefix", "$itemCode"]}
            ]
        },
        revisionNo: {$concat: ["Rev ", {$toString: {$ifNull: ["$prodItemStdCostInfo.revisionInfo.revisionNo", 0]}}]},
        status: 1,
        revisionHistory: "$prodItemStdCostInfo.revisionHistory"
    };
};
