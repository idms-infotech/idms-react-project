exports.getAllPreDispatchInspectionAttributes = () => {
    return {
        preDispatchCode: 1,
        preDispatchDate: {$dateToString: {format: "%d-%m-%Y", date: "$preDispatchDate"}},
        salesInvoiceNumber: 1,
        salesInvoiceDate: {$dateToString: {format: "%d-%m-%Y", date: "$salesInvoiceDate"}},
        customerName: 1,
        preDispatchDetails: 1,
        status: "Need Re-Validation"
    };
};
exports.getAllPreDispatchInspectionReportsAttributes = () => {
    return {
        salesInvoiceNumber: 1,
        salesInvoiceDate:  {$dateToString: {format: "%d-%m-%Y", date: "$salesInvoiceDate"}},
        preDispatchCode: 1,
        isGenerated: 1,
        customerName: "$customer.customerName",
        template: {$ifNull: ["$customerPDIRMapping.template", "Generic PDI Report"]},
        preDispatchDate: {$dateToString: {format: "%d-%m-%Y", date: "$preDispatchDate"}}
    };
};
