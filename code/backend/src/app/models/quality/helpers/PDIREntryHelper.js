exports.getAllPDIREntryAttributes = () => {
    return {
        PDIRCode: 1,
        PDIRDate: 1,
        salesInvoiceDate: {$dateToString: {format: "%d-%m-%Y", date: "$salesInvoiceDate"}},
        salesCategory: 1,
        createdAt: 1,
        salesInvoiceNumber: "$salesInvoice.salesInvoiceNumber",
        customerName: "$customer.customerName"
    };
};
exports.getAllPDIREntryReportsAttributes = () => {
    return {
        PDIRCode: 1,
        isGenerated: 1,
        customerName: "$customer.customerName",
        PDIRDate: {$dateToString: {format: "%d-%m-%Y", date: "$PDIRDate"}}
    };
};
