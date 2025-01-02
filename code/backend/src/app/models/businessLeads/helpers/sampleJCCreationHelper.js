exports.getAllSampleJCCreationAttributes = () => {
    return {
        jobCardNo: 1,
        jobCardDate: {$dateToString: {format: "%d-%m-%Y", date: "$jobCardDate"}},
        customerNickName: "$customers.customerName",
        SKUNo: "$SKUDetails.SKUNo",
        SKUName: "$SKUDetails.SKUName",
        SKUDescription: "$SKUDetails.SKUDescription",
        UOM: "$SKUDetails.UOM",
        batchQty: "$SKUDetails.batchQty",
        status: 1
    };
};
exports.getAllSampleJCReportsAttributes = () => {
    return {
        jobCardNo: 1,
        SKUNo: "$_id.SKUNo",
        _id: "$_id.jobCardNoId",
        batchQty: 1,
        jobCardDate: 1,
        customerNickName: 1,
        SKUName: 1,
        SKUDescription: 1,
        UOM: 1,
        status: 1,
        orderType: 1
    };
};
