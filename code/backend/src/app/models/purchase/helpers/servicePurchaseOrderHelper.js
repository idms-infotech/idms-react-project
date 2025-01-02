exports.getAllServicePurchaseOrderAttributes = () => {
    return {
        SPONumber: 1,
        supplier: "$supplier.supplierName",
        supplier_id: "$supplier._id",
        SPODateS: 1,
        purchaseCategory: 1,
        currency: 1,
        netSPOValue: 1,
        SPOStatus: 1,
        createdAt: 1
    };
};
exports.getAllServicePurchaseOrderExcelAttributes = () => {
    return {
        purchaseCategory: 1,
        supplier: "$supplier.supplierName",
        SPONumber: 1,
        supplier_id: "$supplier._id",
        SPODateS: 1,
        orderReference: 1,
        currency: 1,
        deliveryLocation: 1,
        deliveryDate: {$dateToString: {format: "%d-%m-%Y", date: "$deliveryDate"}},
        netSPOValue: 1,
        SPORemarks: 1,
        SPOStatus: 1
    };
};
exports.getAllServicePurchaseOrderReportsAttributes = () => {
    return {
        SPONumber: 1,
        supplierName: "$supplier.supplierName",
        SPODateS: 1,
        purchaseCategory: 1,
        currency: "$supplier.supplierCurrency",
        netSPOValue: {$round: ["$netSPOValue", 2]},
        SPOStatus: 1,
        createdAt: 1,
        totalAmountWithTax: {
            $round: [
                {
                    $sum: ["$GSTAmount", "$netSPOValue"]
                },
                2
            ]
        },
        GSTAmount: {$round: ["$GSTAmount", 2]},
        locationCond: 1,
        supplier: 1,
        company: 1,
        SPODetails: 1
    };
};
