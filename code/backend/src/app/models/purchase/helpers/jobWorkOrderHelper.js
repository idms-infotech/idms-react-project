exports.getAllJobWorkOrderAttributes = () => {
    return {
        WONo: 1,
        WODate: {$dateToString: {format: "%Y-%m-%d", date: "$WODate"}},
        jobWorkerName: 1,
        orderReference: 1,
        placeOfSupply: 1,
        status: 1
    };
};
exports.getAllJobWorkOrderReportsAttributes = () => {
    return {
        WONo: 1,
        WODate: {$dateToString: {format: "%Y-%m-%d", date: "$WODate"}},
        jobWorkerName: 1,
        orderReference: 1,
        placeOfSupply: 1,
        WOTaxableValue: 1
    };
};
