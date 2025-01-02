const {BOOLEAN_VALUES} = require("../../../mocks/constantData");

exports.getAllLogisticsProviderAttributes = () => {
    return {
        LSPCategory: 1,
        LSPCode: 1,
        LSPName: 1,
        freight: 1,
        GSTClassification: 1,
        GSTINNo: 1,
        currency: 1,
        RCMApplicability: {$cond: [{$eq: [BOOLEAN_VALUES.YES, "$RCMApplicability"]}, "Y", "N"]},
        status: 1
    };
};
