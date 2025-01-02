exports.getAllStockTransferToStoreReportsAttributes = () => {
    return {
        stockTransferDate: {$dateToString: {format: "%d-%m-%Y", date: "$stockTransferDate"}},
        MRNNumber: "$stockTransferDetails.MRNNumber",
        itemCode: "$stockTransferDetails.itemCode",
        itemName: "$stockTransferDetails.itemName",
        itemDescription: "$stockTransferDetails.itemDescription",
        unitConversion: "$stockTransferDetails.unitConversion",
        UOM: "$stockTransferDetails.UOM",
        transferQty: "$stockTransferDetails.transferQty",
        expiryDate: 1,
        status: 1,
        createdAt: 1
    };
};
