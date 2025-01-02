exports.getAllProformaInvoiceAttributes = () => {
    return {
        PINumber: 1,
        PIDateS: 1,
        PONumber: 1,
        salesCategory: 1,
        customer: "$customer.customerName",
        currency: 1,
        PITotalAmount: 1,
        createdAt: 1,
        PIStatus: 1,
        PIDate: 1
    };
};
exports.getAllProformaInvoiceExcelAttributes = () => {
    return {
        PINumber: 1,
        PIDateS: 1,
        billFromLocation: 1,
        customerCategory: "$customer.customerCategory",
        customerName: "$customer.customerName",
        PONumber: 1,
        PODate: {$dateToString: {format: "%d-%m-%Y", date: "$PODate"}},
        currency: 1,
        salesCategory: 1,
        PIValidityDate: {$dateToString: {format: "%d-%m-%Y", date: "$PIValidityDate"}},
        PITotalAmount: 1,
        PIStatus: 1,
        PIDate: {$dateToString: {format: "%d-%m-%Y", date: "$PIDate"}}
    };
};
exports.getAllProformaInvoiceReportsAttributes = () => {
    return {
        PINumber: 1,
        PITotalAmount: 1,
        PIDate: 1,
        PIDateS: 1,
        customerName: "$customer.customerName",
        customer: "$customer._id",
        company: 1,
        PIStatus: 1,
        createdAt: 1,
        salesCategory: 1
    };
};
