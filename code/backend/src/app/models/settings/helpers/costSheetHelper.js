exports.getAllCostSheetAttributes = extra => {
    return {
        componentCode: 1,
        componentType: 1,
        order: 1,
        costElement: 1,
        tooltip: 1,
        status: 1,
        ...extra
    };
};
