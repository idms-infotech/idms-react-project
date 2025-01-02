exports.getAllPackingAttributes = () => {
    return {
        SKU: 1,
        SKUNo: 1,
        SKUName: 1,
        SKUDescription: 1,
        UOM: 1,
        SKUBatchQty: 1,
        prodSource: "$logEntry.prodSource",
        prodDate: "$logEntry.prodDate",
        prodShift: "$logEntry.prodShift",
        operatingStaff: "$logEntry.operatingStaff",
        remarks: "$logEntry.remarks",
        authorizedBy: "$logEntry.authorizedBy"
    };
};
