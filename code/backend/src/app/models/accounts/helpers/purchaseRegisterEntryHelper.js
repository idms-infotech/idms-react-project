exports.getAllPurchaseRegistryEntryAttributes = () => {
    return {
        PEntryNo: 1,
        PEntryDate: {$dateToString: {format: "%d-%m-%Y", date: "$PEntryDate"}},
        supplier: 1,
        supplierName: 1,
        supplierGST: 1,
        supplierCurrency: 1,
        purchaseCategory: 1,
        taxInvoiceNo: 1,
        taxInvoiceDate: {$dateToString: {format: "%d-%m-%Y", date: "$taxInvoiceDate"}},
        taxableAmt: 1,
        SGSTAmt: 1,
        CGSTAmt: 1,
        IGSTAmt: 1,
        totalAmt: 1,
        TCSAmt: 1,
        roundOffAmt: 1,
        roundOffTotalAmt: 1,
        remarks: 1,
        status: 1
    };
};
exports.getAllPREReportsAttributes = () => {
    return {
        PEntryNo: 1,
        PEntryDate: {$dateToString: {format: "%d-%m-%Y", date: "$PEntryDate"}},
        supplierName: 1,
        // supplierGST: 1,
        // purchaseCategory: 1,
        taxInvoiceNo: 1,
        taxInvoiceDate: {$dateToString: {format: "%d-%m-%Y", date: "$taxInvoiceDate"}},
        taxableAmt: 1,
        SGSTAmt: 1,
        CGSTAmt: 1,
        IGSTAmt: 1,
        totalAmt: 1,
        TCSAmt: 1,
        roundOffAmt: 1,
        roundOffTotalAmt: 1
        // status: 1
    };
};
