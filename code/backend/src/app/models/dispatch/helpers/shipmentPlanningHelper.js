exports.getAllShipmentPlanningAttributes = () => {
    return {
        SPNumber: 1,
        DRNNumber: "$DRNId.DRNNumber",
        DRNDate: 1,
        customerName: "$customer.customerName",
        customerCategory: "$customer.customerCategory",
        billFromLocation: 1,
        shipmentValue: 1,
        SPTotalAmount: 1,
        SPV: 1,
        currency: "$SPDetails.currency",
        SPStatus: 1,
        createdAt: 1,
        DRNDateS: 1
    };
};
exports.getAllShipmentPlanningReportsAttributes = () => {
    return {
        SPNumber: 1,
        createdAtS: 1,
        shipmentValue: "$shipmentValue",
        dispatchQty: {$toString: "$SPDetails.dispatchQty"},
        SKUNo: "$SPDetails.SKUNo",
        netRate: {$toString: "$SPDetails.netRate"},
        currency: "$SPDetails.currency",
        customerName: "$customer.customerName",
        city: "$customer.customerShippingAddress.city"
    };
};
