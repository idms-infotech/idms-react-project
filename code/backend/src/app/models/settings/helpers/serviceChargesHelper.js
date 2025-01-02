exports.getAllServiceChargesAttributes = () => {
    return {
        order: 1,
        description: 1,
        SACCode: 1,
        GSTRate: 1,
        IGSTRate: 1,
        SGSTRate: 1,
        CGSTRate: 1,
        UGSTRate: 1,
        status: 1
    };
};
