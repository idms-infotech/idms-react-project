exports.getAllSalesServiceMasterAttributes = () => {
    return {
        serviceCode: 1,
        serviceDescription: 1,
        sacCode: "$sacId.sacCode",
        igst: 1,
        cgst: 1,
        sgst: 1,
        createdAt: 1
    };
};
exports.getAllSalesServiceMasterExcelAttributes = () => {
    return {
        serviceCode: 1,
        serviceDescription: 1,
        sacCode: "$sacId.sacCode",
        gst: 1,
        igst: 1,
        cgst: 1,
        sgst: 1
    };
};
