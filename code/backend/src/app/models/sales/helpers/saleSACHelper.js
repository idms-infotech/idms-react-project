exports.getAllSaleSACAttributes = () => {
    return {
        sacCode: 1,
        serviceDescription: 1,
        gstRate: 1,
        igstRate: 1,
        sgstRate: 1,
        cgstRate: 1,
        ugstRate: 1,
        createdAt: 1,
        revisionHistory: 1,
        isActive: 1,
        revisionInfo: 1,
        revisionNo: {$concat: ["Rev", " ", {$toString: "$revisionInfo.revisionNo"}]}
    };
};
 
