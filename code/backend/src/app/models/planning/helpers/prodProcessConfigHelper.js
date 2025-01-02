exports.getAllProdProcessConfigAttributes = () => {
    return {
        srNo: 1,
        prodProcessName: 1,
        source: 1,
        status: 1,
        revisionHistory: 1,
        prodUnitConfigId: 1,
        revisionNo: {$concat: ["Rev", " ", "$revisionNo"]}
    };
};
