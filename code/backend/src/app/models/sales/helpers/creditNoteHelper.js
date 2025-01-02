exports.getAllCreditNoteAttributes = () => {
    return {
        CNNumber: 1,
        CNDateS: 1,
        salesCategory: 1,
        customerName: "$customer.customerName",
        invoiceNo: 1,
        invoiceDateS: 1,
        currency: 1,
        netCNValue: 1,
        CNStatus: 1,
        reasonCategory: 1,
        createdAt: 1
    };
};
exports.getAllCreditNoteExcelAttributes = () => {
    return {
        CNNumber: 1,
        CNDateS: 1,
        salesCategory: 1,
        customerName: "$customer.customerName",
        invoiceNo: 1,
        invoiceDateS: 1,
        currency: 1,
        netCNValue: 1,
        reasonForCN: 1,
        CNStatus: 1
    };
};
exports.getAllCreditNoteReportsAttributes = () => {
    return {
        CNNumber: 1,
        CNDateS: 1,
        salesCategory: 1,
        customerName: "$customer.customerName",
        invoiceNo: 1,
        invoiceDateS: 1,
        currency: 1,
        netCNValue: "$netCNValue",
        CNStatus: 1,
        creditFor: 1,
        createdAt: 1
    };
};
exports.getAllCNSummaryReportsAttributes = () => {
    return {
        customerName: "$customer.customerName",
        totalCreditNotes: 1,
        totalAmountCredited: 1,
        CNStatus: 1
    };
};
exports.getAllCNDetailsReportsAttributes = () => {
    return {
        CNNumber: 1,
        CNDateS: 1,
        standardRate: "$CNDetails.standardRate",
        customerName: "$customer.customerName",
        salesCategory: 1,
        returnQty: "$CNDetails.returnQty",
        currency: 1,
        lineValue: "$CNDetails.lineValue",
        SKUCode: "$CNDetails.SKU.SKUNo",
        SKUName: "$CNDetails.SKU.SKUName",
        SKUDescription: "$CNDetails.SKU.SKUDescription",
        CNStatus: 1,
        createdAt: 1
    };
};
