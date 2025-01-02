const {getAllMonthName} = require("../../../utilities/utility");

exports.getAllGoodInwardEntryReportsAttributes = () => {
    return {
        GINDate: {$dateToString: {format: "%d-%m-%Y", date: "$GINDate"}},
        MRNNumber: {$ifNull: ["$MRNInfo.MRNNumber", "$docNo"]},
        MRNDate: {$dateToString: {format: "%d-%m-%Y", date: {$ifNull: ["$MRNInfo.MRNDate", "$MRNDate"]}}},
        itemName: "$item.itemName",
        itemCode: "$item.itemCode",
        itemDescription: "$item.itemDescription",
        UOM: "$GINDetails.UOM",
        GINQty: "$GINDetails.GINQty",
        supplierInvoiceDate: {$dateToString: {format: "%d-%m-%Y", date: "$supplierInvoiceDate"}},
        batchDate: {$dateToString: {format: "%d-%m-%Y", date: "$GINDetails.batchDate"}},
        deliveryLocation: {$ifNull: ["$GINDetails.deliveryLocation", "$deliveryLocation"]},
        createdAt: 1
    };
};
exports.getAllGoodInwardEntryAttributes = () => {
    return {
        "GINDetails.GINLineNumber": 1,
        item: 1,
        supplier: 1,
        "GINDetails.batchDate": 1,
        "GINDetails.UOM": 1,
        "GINDetails.purchaseRatINR": 1,
        "GINDetails.lineValueINR": 1
    };
};
exports.getGINSummaryReportsAttributes = () => {
    return {
        GINDateS: {$dateToString: {format: "%d-%m-%Y", date: "$GINDate"}},
        supplierName: 1,
        supplierCurrency: 1,
        GINQty: {$toString: "$GINQty"},
        totalValue: {$toString: "$totalValue"},
        createdAt: 1
    };
};
exports.getGINDetailReportsAttributes = () => {
    return {
        supplierName: "$supplier.supplierName",
        GINDateS: 1,
        itemCode: "$GINDetails.item.itemCode",
        supplierCurrency: "$supplier.supplierCurrency",
        itemDescription: "$GINDetails.item.itemDescription",
        GINQty: 1,
        purchaseRate: 1
    };
};
exports.getGINAnalysisReportsAttributes = () => {
    return {
        itemCode: "$item.itemCode",
        itemDescription: "$item.itemDescription",
        totalInwardQty: {$toString: "$totalInwardQty"},
        totalInwardValue: {$toString: "$totalInwardValue"}
    };
};
exports.getGINTrendAnalysisReportsAttributes = () => {
    const months = getAllMonthName();
    return {
        month: {
            $arrayElemAt: [months, {$subtract: ["$_id", 1]}]
        },
        totalInwardQty: {$toString: "$totalInwardQty"},
        totalInwardValue: {$toString: "$totalInwardValue"},
        GINDate: "$_id"
    };
};
