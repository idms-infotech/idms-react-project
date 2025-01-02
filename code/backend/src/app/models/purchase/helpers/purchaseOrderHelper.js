exports.getAllPurchaseOrderAttributes = extra => {
    return {
        _id: 1,
        id: "$_id",
        PONumber: 1,
        PODateS: 1,
        purchaseCategory: 1,
        POType: 1,
        POValidity: 1,
        supplierName: "$supplier.supplierName",
        currency: 1,
        netPOValue: 1,
        POStatus: 1,
        createdAt: 1,
        ...extra
    };
};

exports.getAllPPVReportsAttributes = () => {
    return {
        PONumber: 1,
        PODateS: 1,
        supplierName: "$supplier.supplierName",
        itemCode: "$PODetails.item.itemCode",
        itemDescription: "$PODetails.item.itemDescription",
        POQty: 1,
        ppv: "$ppv",
        standardRate: "$PODetails.standardRate",
        purchaseRate: "$PODetails.purchaseRate",
        company: 1,
        POStatus: 1,
        createdAt: 1
    };
};

exports.getAllPOSummaryReportsAttributes = () => {
    return {
        supplierName: "$supplier.supplierName",
        itemCategory: 1,
        currency: 1,
        PODateMin: 1,
        PODateMax: 1,
        dateRange: {
            $concat: [
                {$dateToString: {format: "%d-%m-%Y", date: "$PODateMin"}},
                "/",
                {$dateToString: {format: "%d-%m-%Y", date: "$PODateMax"}}
            ]
        },
        totalOrders: 1,
        createdAt: 1,
        totalAmount: 1,
        avgOrderValue: {$round: ["$avgOrderValue", 2]}
    };
};

exports.getAllPOCostAnalysisReportsAttributes = () => {
    return {
        currency: 1,
        PODateMin: 1,
        PODateMax: 1,
        dateRange: {
            $concat: [
                {$dateToString: {format: "%d-%m-%Y", date: "$PODateMin"}},
                "/",
                {$dateToString: {format: "%d-%m-%Y", date: "$PODateMax"}}
            ]
        },
        totalOrders: 1,
        totalTotalCost: 1,
        averageCost: 1,
        minCost: 1,
        maxCost: 1,
        itemType: "$item.itemType",
        itemName: "$item.itemName",
        supplierName: "$supplier.supplierName"
    };
};
exports.getAllPPVReportsBySupplierAttributes = () => {
    return {
        totalQuantityPurchased: 1,
        totalPurchaseAmount: 1,
        currency: 1,
        totalPPV: "$totalPPV",
        itemCode: "$item.itemCode",
        itemDescription: "$item.itemDescription",
        itemType: "$item.itemType",
        supplierName: "$supplier.supplierName"
    };
};
exports.getAllPurchaseRateAnalysisByItemAttributes = () => {
    return {
        itemCode: "$item.itemCode",
        itemName: "$item.itemName",
        itemDescription: "$item.itemDescription",
        supplierName: "$supplier.supplierName",
        standardRate: 1,
        PORateMin: {$round: ["$PORateMin", 2]},
        PORateMax: {$round: ["$PORateMax", 2]},
        avgRate: {$round: ["$avgRate", 2]},
        lastPurchaseRate: {$round: ["$lastPurchaseRate", 2]},
        remarks: 1
    };
};
exports.getAllPPVDetailsReportsAttributes = () => {
    return {
        PONumber: 1,
        PODateS: 1,
        POQty: 1,
        supplierName: "$supplier.supplierName",
        itemCode: "$PODetails.item.itemCode",
        itemDescription: "$PODetails.item.itemDescription",
        POQty: {$round: ["$PODetails.POQty", 2]},
        standardPrice: {$round: ["$PODetails.standardRate", 2]},
        actualPrice: {$round: ["$PODetails.purchaseRate", 2]},
        variance: {$round: ["$PODetails.linePPV", 2]},
        currency: 1,
        variancePercentage: {
            $round: [
                {
                    $multiply: [
                        {
                            $divide: [
                                {
                                    $subtract: ["$PODetails.standardRate", "$PODetails.purchaseRate"]
                                },
                                "$PODetails.standardRate"
                            ]
                        },
                        100
                    ]
                },
                2
            ]
        }
    };
};
exports.getAllOutstandingPOReportsAttributes = () => {
    return {
        PONumber: 1,
        PODateS: 1,
        deliveryDate: {$dateToString: {format: "%d-%m-%Y", date: "$PODetails.deliveryDate"}},
        supplierName: "$supplier.supplierName",
        itemCode: "$PODetails.item.itemCode",
        itemName: "$PODetails.item.itemName",
        itemDescription: "$PODetails.item.itemDescription",
        POQty: 1,
        balancedQty: 1,
        GRNQty: {$subtract: ["$PODetails.POQty", "$PODetails.balancedQty"]},
        PODate: 1,
        createdAt: 1
    };
};
exports.getAllShortPOForClosingAttributes = () => {
    return {
        PODate: {$dateToString: {format: "%d-%m-%Y", date: "$PODate"}},
        PONumber: 1,
        POLineNumber: "$PODetails.POLineNumber",
        itemCode: "$PODetails.item.itemCode",
        itemName: "$PODetails.item.itemName",
        balancedQty: "$PODetails.balancedQty",
        lineValue: "$PODetails.lineValue",
        supplierName: "$supplier.supplierName",
        PODetailsId: "$PODetails._id",
        createdAt: 1
    };
};
exports.getAllPurchaseOrderReportsAttributes = () => {
    return {
        _id: 1,
        PONumber: 1,
        PODateS: 1,
        supplierName: "$supplier.supplierName",
        currency: 1,
        netPOValue: {$round: ["$netPOValue", 2]},
        POStatus: 1,
        createdAt: 1,
        orderReference: 1,
        // PODetails: 1,
        totalAmountWithTax: {
            $round: [
                {
                    $sum: ["$GSTAmount", "$netPOValue"]
                },
                2
            ]
        },
        GSTAmount: {$round: ["$GSTAmount", 2]}
    };
};
exports.getAllItemConsumptionReportsAttributes = () => {
    return {
        _id: 0,
        itemCode: "$item.itemCode",
        itemName: "$item.itemName",
        itemDescription: "$item.itemDescription",
        UOM: "$_id.UOM",
        jan: {$round: ["$jan", 2]},
        feb: {$round: ["$feb", 2]},
        mar: {$round: ["$mar", 2]},
        apr: {$round: ["$apr", 2]},
        may: {$round: ["$may", 2]},
        jun: {$round: ["$jun", 2]},
        jul: {$round: ["$jul", 2]},
        aug: {$round: ["$aug", 2]},
        sep: {$round: ["$sep", 2]},
        oct: {$round: ["$oct", 2]},
        nov: {$round: ["$nov", 2]},
        dec: {$round: ["$dec", 2]},
        avg: {$round: [{$divide: ["$total", 12]}, 2]},
        total: {$round: ["$total", 2]},
        netRate: {$round: ["$netRate", 2]},
        totalCost: {
            $round: [{$multiply: ["$total", "$netRate"]}, 2]
        }
    };
};
