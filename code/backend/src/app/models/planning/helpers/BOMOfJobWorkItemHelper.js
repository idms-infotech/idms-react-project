exports.getAllBOMOfJobWorkItemAttributes = () => {
    return {
        BOMNo: {
            $ifNull: [
                "$BOMOfJobWorkItem.BOMOfJWICode",
                {$concat: ["$childItemCategoryInfo.BOMPrefix", "$jobWorkItemCode"]}
            ]
        },
        jobWorkItemCode: "$jobWorkItemCode",
        jobWorkItemName: "$jobWorkItemName",
        jobWorkItemDescription: "$jobWorkItemDescription",
        itemCategory: "$itemCategory",
        UOM: "$orderInfoUOM",
        partCount: "$BOMOfJobWorkItem.partCount",
        totalMaterialCost: "$BOMOfJobWorkItem.totalMaterialCost",
        status: 1,
        revisionHistory: "$BOMOfJobWorkItem.revisionHistory",
        revisionNo: {$concat: ["Rev", " ", {$toString: {$ifNull: ["$BOMOfJobWorkItem.revisionNo", 0]}}]}
    };
};
