exports.getAllAdvanceShipmentAttributes = () => {
    return {
        ASNNumber: 1,
        stateOfSupply: 1,
        totalNoOfBoxes: 1,
        totalGrossWeight: 1,
        invoiceValue: 1,
        salesInvoiceDate: {$dateToString: {format: "%d-%m-%Y", date: "$salesInvoiceDate"}},
        ASNStatus: 1,
        transporter: 1,
        createdAt: 1,
        salesInvoiceNumber: "$salesInvoice.salesInvoiceNumber",
        customerName: "$customer.customerName"
    };
};
exports.getAllAdvanceShipmentReportAttributes = () => {
    return {
        ASNNumber: 1,
        stateOfSupply: 1,
        totalNoOfBoxes: 1,
        totalGrossWeight: 1,
        invoiceValue: 1,
        salesInvoiceDate: {$dateToString: {format: "%d-%m-%Y", date: "$salesInvoiceDate"}},
        ASNStatus: 1,
        transporter: 1,
        createdAt: 1,
        salesInvoiceNumber: "$salesInvoice.salesInvoiceNumber",
        customerName: "$customer.customerName"
    };
};
