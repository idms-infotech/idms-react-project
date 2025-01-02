exports.getAllJobWorkChallanAttributes = () => {
    return {
        JWChallanNo: 1,
        JWChallanDate: {$dateToString: {format: "%d-%m-%Y", date: "$JWChallanDate"}},
        jobWorkerName: 1,
        currency: 1,
        placeOfSupply: 1,
        totalTaxableAmt: 1,
        status: 1
    };
};
exports.getAllJobWorkChallanReportsAttributes = () => {
    return {
        JWChallanNo: 1,
        JWChallanDate: {$dateToString: {format: "%d-%m-%Y", date: "$JWChallanDate"}},
        jobWorkerName: 1,
        currency: 1,
        placeOfSupply: 1,
        totalTaxableAmt: 1,
        ewayBillNo: 1,
        EWayBillPdfUrl: 1,
        EWayBillQrCodeUrl: 1,
        eWayBillStatus: 1,
        status: 1
    };
};
exports.getAllJobWorkChallanTableItemsAttributes = () => {
    return {
        JWLChallanLineNo: 1,
        item: 1,
        referenceModel: 1,
        itemCode: 1,
        itemName: 1,
        itemDescription: 1,
        UOM: 1,
        primaryToSecondaryConversion: 1,
        primaryUnit: 1,
        secondaryUnit: 1,
        conversionOfUnits: 1,
        currency: 1,
        HSNCode: 1,
        gst: 1,
        igst: 1,
        cgst: 1,
        sgst: 1,
        ugst: 1,
        unitRate: 1,
        stdCostUom1: 1,
        stdCostUom2: 1,
        quantity: 1,
        taxableAmt: 1,
        closedIRQty: 1
    };
};
