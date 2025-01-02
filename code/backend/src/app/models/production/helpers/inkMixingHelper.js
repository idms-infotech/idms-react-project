exports.getAllInkMixingAttributes = () => {
    return {
        jobCardNo: 1,
        itemCode: "$inkMixingDetails.itemCode",
        itemName: "$inkMixingDetails.itemName",
        itemDescription: "$inkMixingDetails.itemDescription",
        UOM: "$inkMixingDetails.UOM",
        batchQty: "$inkMixingDetails.batchQty",
        batchDate: {$dateToString: {format: "%d-%m-%Y", date: "$inkMixingDetails.remarks.manufacturingDate"}},
        logBookRef: "$inkMixingDetails.remarks.logBookRef"
    };
};
