exports.getAllGoodsRequisitionAttributes = () => {
    return {
        GRNumber: 1,
        GRDate: 1,
        salesOrderSKUReference: 1,
        GRStatus: 1,
        GRDateS: 1,
        deliveryLocation: 1,
        department: 1,
        createdAt: 1
    };
};
exports.getAllFilterDataAttributes = () => {
    return {
        itemName: 1,
        itemCode: 1,
        itemDescription: 1,
        conversionOfUnits: 1,
        primaryUnit: "$inventory.UOM",
        itemType: 1,
        itemSubCategory: 1,
        createdAt: 1,
        closedIRQty: {$round: ["$inventory.closedIRQty", 2]}
    };
};
