exports.getAllSACAttributes = () => {
    return {
        sacCode: 1,
        serviceDescription: 1,
        gstRate: 1,
        igstRate: 1,
        sgstRate: 1,
        cgstRate: 1,
        ugstRate: 1,
        revisionNo: {$concat: ["Rev", " ", {$toString: "$revisionInfo.revisionNo"}]},
        revisionDate: {$dateToString: {format: "%d-%m-%Y", date: "$revisionInfo.revisionDate"}},
        isActive: 1,
        revisionHistory: 1
    };
};
