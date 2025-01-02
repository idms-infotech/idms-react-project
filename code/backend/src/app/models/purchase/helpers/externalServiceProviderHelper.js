exports.getAllExternalServiceProviderAttributes = () => {
    return {
        ESPCategory: 1,
        ESPCode: 1,
        ESPName: 1,
        GSTClassification: 1,
        GSTIN: 1,
        currency: 1,
        isESPActive: 1,
        country: "$billingAddress.country",
        state: "$billingAddress.state",
        billingAddress: 1,
        shippingAddress: 1,
        createdAt: 1
    };
};
exports.getAllExternalServiceProviderExcelAttributes = () => {
    return {
        ESPCategory: 1,
        ESPCode: 1,
        ESPName: 1,
        GSTClassification: 1,
        GSTIN: 1,
        currency: 1,
        isESPActive: 1,
        country: "$billingAddress.country",
        state: "$billingAddress.state",
        billingAddress: 1,
        shippingAddress: 1,
        createdAt: 1
    };
};
