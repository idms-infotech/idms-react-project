exports.getAllFGINAttributes = () => {
    return {
        SKUNo: 1,
        SKUName: 1,
        SKUDescription: 1,
        UOM: 1,
        FGINDate: 1,
        manufacturingDate: 1,
        expiryDate: 1,
        FGINQuantity: 1,
        previousDRNQty: 1,
        batchNo: 1
    };
};
exports.getAllFGINReportsAttributes = () => {
    return {
        _id: 0,
        SKUNo: 1,
        SKUName: 1,
        SKUDescription: 1,
        UOM: 1,
        FGINQuantity: 1,
        batchNo: 1,
        manufacturingDateS: 1,
        manufacturingDate: 1,
        expiryDateS: 1,
        balancedQty: 1,
        company: 1,
        SKUId: 1,
        createdAt: 1,
        status: 1
    };
};
exports.getAllFGINSummaryReportsAttributes = () => {
    return {
        // SKUNo: "$_id.SKUNo",
        // SKUName: "$_id.SKUName",
        // totalEntries: "$totalEntries",
        // totalQty: "$totalQty"
        SKUName: 1,
        SKUNo: 1,
        SKUDescription: 1,
        partNo: 1,
        UOM: 1,
        FGINNo: 1,
        FGINDate: {
            $dateToString: {
                format: "%d-%m-%Y",
                date: "$FGINDate",
                timezone: "Asia/Kolkata"
            }
        },
        manufacturingDate: {$dateToString: {format: "%d-%m-%Y", date: "$manufacturingDate", timezone: "Asia/Kolkata"}},
        expiryDate: {$dateToString: {format: "%d-%m-%Y", date: "$expiryDate", timezone: "Asia/Kolkata"}},
        FGINQuantity: "$producedQty",
        batchNo: 1,
        location: 1
    };
};
exports.getAllFGINLocationWiseReportsAttributes = () => {
    return {
        FGINNo: 1,
        FGINDate: {$dateToString: {format: "%d-%m-%Y", date: "$FGINDate"}},
        SKUNo: 1,
        SKUName: 1,
        SKUDescription: 1,
        partNo: 1,
        UOM: 1,
        jobCardNo: 1,
        manufacturingDate: {$dateToString: {format: "%d-%m-%Y", date: "$manufacturingDate"}},
        expiryDate: 1,
        FGINQuantity: {$toString: "$FGINQuantity"},
        producedQty: {$toString: "$producedQty"},
        batchNo: 1,
        aging: "green"
    };
};
exports.getAllFGINAllLocationReportsAttributes = () => {
    return {
        SKUName: 1,
        SKUNo: 1,
        SKUDescription: 1,
        partNo: 1,
        UOM: 1,
        FGINDate: {$dateToString: {format: "%d-%m-%Y", date: "$FGINDate"}},
        manufacturingDate: {$dateToString: {format: "%d-%m-%Y", date: "$manufacturingDate"}},
        expiryDate: 1,
        FGINQuantity: {$toString: "$FGINQuantity"},
        batchNo: 1,
        location: 1,
        aging: "green"
    };
};
exports.getAllFGINValueFinanceReportsAttributes = () => {
    return {
        SKUName: 1,
        SKUNo: 1,
        SKUDescription: 1,
        UOM: 1,
        manufacturingDate: {$dateToString: {format: "%d-%m-%Y", date: "$manufacturingDate"}},
        batchNo: 1,
        location: 1,
        customerCurrency: "$customerInfo.customerCurrency",
        standardSellingRate: "$customerInfo.standardSellingRate",
        lineValue: "$lineValue",
        FGINQuantity: {$toString: "$FGINQuantity"},
        expiryDate: 1,
        aging: "green"
    };
};

exports.getAllFGInventoryReportsAttributes = () => {
    return {
        FGINDate: {$dateToString: {format: "%d-%m-%Y", date: "$FGINDate"}},
        SKUName: 1,
        SKUNo: 1,
        SKUDescription: 1,
        partNo: 1,
        UOM: 1,
        manufacturingDate: {$dateToString: {format: "%d-%m-%Y", date: "$manufacturingDate"}},
        expiryDate: {$dateToString: {format: "%d-%m-%Y", date: "$expiryDate"}},
        FGINQuantity: "$FGINQuantity",
        batchNo: 1,
        location: 1,
        aging: 1,
        SKU: 1
    };
};
exports.getAllFGBalanceSummaryReportsAttributes = () => {
    return {
        // SKUNo: "$_id.SKUNo",
        // SKUName: "$_id.SKUName",
        // totalEntries: "$totalEntries",
        // totalQty: "$totalQty"
        SKUName: 1,
        SKUNo: 1,
        SKUDescription: 1,
        partNo: 1,
        UOM: 1,
        FGINNo: 1,
        FGINDate: {$dateToString: {format: "%d-%m-%Y", date: "$FGINDate"}},
        manufacturingDate: {$dateToString: {format: "%d-%m-%Y", date: "$manufacturingDate"}},
        expiryDate: {$dateToString: {format: "%d-%m-%Y", date: "$expiryDate"}},
        FGINQuantity: 1,
        batchNo: 1,
        location: 1
    };
};
