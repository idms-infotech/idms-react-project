exports.getAllMaterialRevalidationAttributes = () => {
    return {
        MRVNumber: 1,
        MRVDate: {$dateToString: {format: "%d-%m-%Y", date: "$MRVDate"}},
        location: 1,
        invZoneName: 1,
        MRVStatus: 1
    };
};
exports.getAllMaterialRevalidationReportsAttributes = () => {
    return {
        MRVNumber: 1,
        MRVDate: {$dateToString: {format: "%d-%m-%Y", date: "$MRVDate"}},
        location: 1,
        MRNNumber: "$MRVDetails.MRNNumber",
        itemCode: "$MRVDetails.itemCode",
        itemName: "$MRVDetails.itemName",
        itemDescription: "$MRVDetails.itemDescription",
        UOM: "$MRVDetails.UOM",
        QRTQty: "$MRVDetails.QRTQty",
        batchDate:{$dateToString: {format: "%d-%m-%Y", date: "$MRVDetails.batchDate"}},
        releasedQty: "$MRVDetails.releasedQty",
        rejectedQty: "$MRVDetails.rejectedQty"
    };
};
