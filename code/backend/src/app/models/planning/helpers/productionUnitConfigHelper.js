exports.getAllProductionUnitConfigAttributes = () => {
    return {
        revisionNo: {$concat: ["Rev", " ", "$revisionNo"]},
        srNo: 1,
        prodUnitName: 1,
        prodUnitCode: 1,
        status: 1,
        SKUFlag: 1,
        formulationFlag: 1,
        materialFlag: 1,
        revisionHistory: 1
    };
};
