exports.getAllDebitNoteAttributes = () => {
    return {
        DNNumber: 1,
        DNDateS: 1,
        purchaseCategory: 1,
        supplierName: "$supplier.supplierName",
        invoiceNo: 1,
        invoiceDateS: 1,
        currency: 1,
        netDNValue: 1,
        reasonForDN: 1,
        DNStatus: 1
    };
};
exports.getAllDebitNoteReportsAttributes = () => {
    return {
        DNNumber: 1,
        DNDateS: 1,
        purchaseCategory: 1,
        supplierName: "$supplier.supplierName",
        invoiceNo: 1,
        invoiceDateS: 1,
        currency: 1,
        netDNValue: "$netDNValue",
        DNStatus: 1,
        createdAt: 1
    };
};
