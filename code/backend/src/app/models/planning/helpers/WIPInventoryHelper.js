exports.getAllWIPInventoryReportsAttributes = () => {
    return {
        GINDate: {$dateToString: {format: "%d-%m-%Y", date: "$GINDate"}},
        MRNNumber: 1,
        itemCode: 1,
        itemName: 1,
        itemDescription: 1,
        unitConversion: 1,
        UOM: 1,
        PPICQty: 1,
        aging: 1,
        createdAt: 1,
        expiryDate: 1
    };
};
