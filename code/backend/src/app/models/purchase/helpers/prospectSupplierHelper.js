exports.getAllProspectSupplierAttributes = () => {
    return {
        regNo: 1,
        regDate: {$dateToString: {format: "%d-%m-%Y", date: "$regDate"}},
        supplierName: 1,
        supplierGST: 1,
        country: "$supplierBillingAddress.country",
        state: "$supplierBillingAddress.state",
        status: 1
    };
};
exports.getAllProspectSupplierReportsAttributes = () => {
    return {
        regNo: 1,
        regDate: {$dateToString: {format: "%d-%m-%Y", date: "$regDate"}},
        supplierName: 1,
        supplierGST: 1,
        supplierStatus: 1,
        country: "$supplierBillingAddress.country",
        state: "$supplierBillingAddress.state"
    };
};
