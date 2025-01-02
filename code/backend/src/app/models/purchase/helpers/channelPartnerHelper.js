exports.getAllChannelPartnerAttributes = () => {
    return {
        channelPartnerCategory: 1,
        CPCode: 1,
        channelPartnerName: 1,
        GSTClassification: 1,
        GSTIN: 1,
        currency: 1,
        isESPActive: 1,
        country: "$billingAddress.country",
        state: "$billingAddress.state",
        billingAddress: 1,
        shippingAddress: 1,
        isCPActive: 1,
        createdAt: 1
    };
};

exports.getAllChannelPartnerExcelAttributes = () => {
    return {
        channelPartnerCategory: 1,
        CPCode: 1,
        channelPartnerName: 1,
        channelPartnerNickName: 1,
        GSTClassification: 1,
        GSTIN: 1,
        currency: 1,
        isESPActive: 1,
        country: "$billingAddress.country",
        state: "$billingAddress.state",
        billingAddress: 1,
        shippingAddress: 1,
        isCPActive: 1,
        createdAt: 1
    };
};
