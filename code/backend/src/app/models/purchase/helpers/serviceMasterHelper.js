exports.getAllServiceMasterAttributes = () => {
    return {
        serviceCode: 1,
        serviceDescription: 1,
        sacCode: "$sacId.sacCode",
        gst: 1,
        igst: 1,
        cgst: 1,
        sgst: 1,
        isActive: 1,
        createdAt: 1
    };
};
