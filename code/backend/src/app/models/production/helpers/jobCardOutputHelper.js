exports.getAllJobCardOutputAttributes = () => {
    return {
        jobCardOutputNo: 1,
        jobCardNo: 1,
        SKUNo: 1,
        SKUName: 1,
        SKUDescription: 1,
        batchDate: {$dateToString: {format: "%Y-%m-%d", date: "$batchDate"}},
        batchInputQty: 1,
        batchOutputQty: 1,
        approvedDate: {$dateToString: {format: "%Y-%m-%d", date: "$approvedDate"}},
        status: 1
    };
};
