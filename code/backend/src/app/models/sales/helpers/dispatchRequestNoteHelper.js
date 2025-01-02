exports.getAllDispatchRequestNoteAttributes = () => {
    return {
        DRNNumber: 1,
        DRNDate: 1,
        salesCategory: 1,
        customerName: "$customer.customerName",
        DRNStatus: 1,
        DRNDateS: 1,
        createdAt: 1
    };
};

exports.getAllDRNSummaryReportAttributes = () => {
    return {
        DRNNumber: 1,
        DRNDate: {$dateToString: {format: "%d-%m-%Y", date: "$DRNDate"}},
        customerName: "$customer.customerName",
        DRNStatus: 1,
        createdAt: 1,
        SONumber: "$DRNDetails.SONumber",
        SODate: {$dateToString: {format: "%d-%m-%Y", date: "$DRNDetails.SODate"}},
        SKUNo: "$DRNDetails.SKUNo",
        SKUName: "$DRNDetails.SKUName",
        SKUDescription: "$DRNDetails.SKUDescription",
        UOM: "$DRNDetails.UOM",
        dispatchQty: "$DRNDetails.dispatchQty"
    };
};

exports.getAllReportAttributes = () => {
    return {
        DRNNumber: 1,
        customerName: "$customer.customerName",
        customerBillingAddress: "$customer.customerBillingAddress",
        SONumber: "$DRNDetails.SONumber",
        SKUName: "$DRNDetails.SKUName",
        UOM: "$DRNDetails.UOM",
        dispatchQty: "$DRNDetails.dispatchQty",
        customerShippingAddress: 1,
        transporter: 1,
        destination: 1
    };
};
