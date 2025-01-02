exports.getAllServiceInvoiceAttributes = () => {
    return {
        serviceInvoiceNumber: {$toString: "$serviceInvoiceNumber"},
        serviceInvoiceDate: {$dateToString: {format: "%d-%m-%Y", date: "$serviceInvoiceDate"}},
        PONo: 1,
        createdAt: 1,
        currency: 1,
        status: 1,
        customerName: 1,
        totalAmountWithTax: 1,
        invoiceAmount: "$totalValue"
    };
};
exports.getAllServiceInvoiceExcelAttributes = () => {
    return {
        serviceInvoiceNumber: {$toString: "$serviceInvoiceNumber"},
        serviceInvoiceDate: {$dateToString: {format: "%d-%m-%Y", date: "$serviceInvoiceDate"}},
        customerCategory: 1,
        customerName: 1,
        PONo: 1,
        PODate: {$dateToString: {format: "%d-%m-%Y", date: "$PODate"}},
        currency: 1,
        billFromLocation: 1,
        totalValue: 1,
        remarks: 1,
        status: 1,
        invoiceAmount: "$totalValue"
    };
};
exports.getAllServiceInvoiceReportsAttributes = () => {
    return {
        serviceInvoiceNumber: {$toString: "$serviceInvoiceNumber"},
        serviceInvoiceDate: {$dateToString: {format: "%d-%m-%Y", date: "$serviceInvoiceDate"}},
        PONo: 1,
        createdAt: 1,
        currency: 1,
        status: 1,
        customerName: 1,
        invoiceAmount: "$totalValue",
        totalAmountWithTax: "$totalAmountWithTax",
        totalTaxAmount: "$totalTaxAmount",
        InvoicePdfUrl: 1,
        SignedQrCodeImgUrl: 1,
        Irn: 1,
        AckNo: 1
    };
};
exports.getAllSIInvoicePaymentReportsAttributes = () => {
    return {
        customerName: 1,
        totalValue: {$toString: {$round: ["$totalValue", 1]}},
        serviceInvoiceDate: {$dateToString: {format: "%d-%m-%Y", date: "$serviceInvoiceDate"}},
        GSTAmount: {$toString: {$round: ["$totalTaxAmount", 1]}},
        totalAmountWithTax: {$toString: "$totalAmountWithTax"},
        invoiceAge: {$toString: "$invoiceAge"},
        invoiceFlag: {
            $cond: [{$lte: ["$invoiceAge", 30]}, "green", {$cond: [{$gt: ["$invoiceAge", 45]}, "red", "yellow"]}]
        }
    };
};
