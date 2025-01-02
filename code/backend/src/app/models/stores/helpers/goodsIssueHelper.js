exports.getAllGoodsIssueAttributes = () => {
    return {
        GRNumber: "$GRNumber.GRNumber",
        GRDateS: 1,
        GINumber: 1,
        GIDateS: 1,
        deliveryLocation: 1,
        department: 1,
        GIStatus: 1,
        remarks: 1,
        createdAt: 1
    };
};
exports.getAllGoodsIssueReportsAttributes = () => {
    return {
        GIDate: {$dateToString: {format: "%d-%m-%Y", date: "$GIDate"}},
        GRNumber: "$GRNumber.GRNumber",
        MRNNumber: "$GIDetails.MRN.MRNNumber",
        itemCode: "$GIDetails.item.itemCode",
        itemName: "$GIDetails.item.itemName",
        GINDate: "$GIDetails.GIN.GINDate",
        itemDescription: "$GIDetails.item.itemDescription",
        shelfLife: "$GIDetails.item.shelfLife",
        UOM: "$GIDetails.UOM",
        GRQty: "$GIDetails.GRQty",
        GIQty: "$GIDetails.GIQty",
        deliveryLocation: 1,
        createdAt: 1
    };
};
