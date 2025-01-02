exports.getAllJWIItemStdCostAttributes = () => {
    return {
        jobWorkItemCode: 1,
        jobWorkItemName: 1,
        jobWorkItemDescription: 1,
        itemCategory: 1,
        orderInfoUOM: 1,
        costSheetNo: {
            $ifNull: [
                "$JWIItemStdCostInfo.costSheetNo",
                {$concat: ["$childItemCategoryInfo.costSheetPrefix", "$jobWorkItemCode"]}
            ]
        },
        revisionNo: {$concat: ["Rev ", {$toString: {$ifNull: ["$JWIItemStdCostInfo.revisionInfo.revisionNo", 0]}}]},
        status: 1,
        revisionHistory: "$JWIItemStdCostInfo.revisionHistory"
    };
};
