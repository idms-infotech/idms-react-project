exports.getAllInvoicePaymentAttributes = () => {
    return {
        customerName: 1,
        projectName: 1,
        serviceInvoiceNumber: 1,
        serviceInvoiceDate: {$dateToString: {format: "%d-%m-%Y", date: "$serviceInvoiceDate"}},
        totalAmountWithTax: 1,
        receivedAmount: {$sum: "$paymentHistory.receivedAmount"},
        receivedDate: {$dateToString: {format: "%d-%m-%Y", date: "$firstPayment.receivedDate"}}
    };
};
exports.getAllInvoicePaymentExcelAttributes = () => {
    return {
        customerName: 1,
        serviceInvoiceNumber: 1,
        serviceInvoiceDate: {$dateToString: {format: "%d-%m-%Y", date: "$serviceInvoiceDate"}},
        totalAmountWithTax: 1,
        receivedAmount: {$sum: "$paymentHistory.receivedAmount"},
        receivedDate: {$dateToString: {format: "%d-%m-%Y", date: "$firstPayment.receivedDate"}},
        outstandingAmount: 1,
        totalValue: 1
    };
};
exports.getAllInvoicePaymentReportsAttributes = () => {
    return {
        customerName: 1,
        serviceInvoiceNumber: 1,
        serviceInvoiceDate: {$dateToString: {format: "%d-%m-%Y", date: "$serviceInvoiceDate"}},
        totalAmountWithTax: 1,
        receivedAmount: {$sum: "$paymentHistory.receivedAmount"},
        receivedDate: {$dateToString: {format: "%d-%m-%Y", date: "$lastPayment.receivedDate"}},
        invoiceAge: {$toString: "$invoiceAge"},
        invoiceFlag: {
            $cond: [{$lte: ["$invoiceAge", 30]}, "green", {$cond: [{$gt: ["$invoiceAge", 45]}, "red", "yellow"]}]
        }
    };
};
