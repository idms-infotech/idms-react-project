exports.getAllB2CustomerAttributes = () => {
    return {
        customerName: 1,
        emailId: 1,
        mobileNo: 1,
        stateOfSupply: 1,
        createdAt: 1
    };
};
exports.getAllB2CustomerExcelAttributes = () => {
    return {
        customerName: 1,
        mobileNo: 1,
        emailId: 1,
        stateOfSupply: 1,
        line1: 1,
        line2: 1,
        district: 1,
        pinCode: 1,
        state: 1,
        country: 1
    };
};
