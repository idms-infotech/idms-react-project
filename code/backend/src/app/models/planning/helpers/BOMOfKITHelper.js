exports.getAllBOMOfKITAttributes = () => {
    return {
        _id: 1,
        KITNo: 1,
        KITName: 1,
        KITDescription: 1,
        primaryUnit: 1,
        KITCategory: 1,
        revisionNo: 1,
        revisionInfo: "$BOMOfKIT.revisionInfo",
        BOMStatus: 1,
        categoryPrefix: 1,
        revisionHistory: "$BOMOfKIT.revisionHistory",
        BOMNo: {$replaceOne: {input: "$KITNo", find: "$categoryPrefix", replacement: "$BOMPrefix"}}
    };
};
