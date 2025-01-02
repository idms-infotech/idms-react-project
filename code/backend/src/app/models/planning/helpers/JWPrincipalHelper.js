exports.getAllJWPrincipalAttributes = () => {
    return {
        JWPrincipalCode: 1,
        JWPrincipalName: 1,
        GSTINNo: 1,
        currency: 1,
        status: 1,
        country: "$primaryAddress.country",
        state: "$primaryAddress.state"
    };
};
