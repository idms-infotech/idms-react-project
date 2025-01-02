exports.getAllDirectTaxInvoiceAttributes = () => {
    return {
        DTICode: 1,
        salesInvoiceDate: {$dateToString: {format: "%d-%m-%Y", date: "$salesInvoiceDate"}},
        salesInvoiceTotalAmount: 1,
        customerName: "$customer.customerName",
        DTIStatus: 1
    };
};
