exports.getAllSalesDebitNoteAttributes = () => {
    return {
        DNNumber: 1,
        DNDateS: 1,
        salesCategory: 1,
        customerName: "$customer.customerName",
        invoiceNo: 1,
        invoiceDateS: 1,
        currency: 1,
        netDNValue: 1,
        reasonForDN: 1,
        DNStatus: 1
    };
};
exports.getAllSalesDebitNoteReportsAttributes = () => {
    return {
        DNNumber: 1,
        DNDateS: 1,
        salesCategory: 1,
        customerName: 1,
        invoiceNo: 1,
        invoiceDateS: 1,
        currency: 1,
        netDNValue: 1,
        DNStatus: 1,
        createdAt: 1,
        netDNValue: {$toString: "$netDNValue"}
    };
};
exports.getAllSalesDNDetailsReportsAttributes = () => {
    return {
        DNNumber: 1,
        DNDateS: 1,
        DNStatus: 1,
        customerName: "$customer.customerName",
        salesCategory: 1,
        returnQty: "$DNDetails.returnQty",
        purchaseRate: "$DNDetails.purchaseRate",
        currency: 1,
        lineValue: "$DNDetails.lineValue",
        SKUNo: "$DNDetails.SKU.SKUNo",
        SKUName: "$DNDetails.SKU.SKUName",
        SKUDescription: "$DNDetails.SKU.SKUDescription",
        DNStatus: 1,
        createdAt: 1
    };
};
