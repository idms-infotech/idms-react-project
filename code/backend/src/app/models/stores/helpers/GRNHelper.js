const {getAllSupplierRules} = require("../../../controllers/v1/purchase/supplierRule/supplierRuleMaster");

exports.getAllGRNAttributes = () => {
    return {
        GRNNumber: 1,
        GRNDateS: 1,
        supplierInvoiceRef: 1,
        GRNStatus: 1,
        supplier: "$supplierName",
        supplier_id: "$supplier._id",
        PONumber: {$ifNull: ["$PONumber", "-"]},
        PODate: {$ifNull: [{$dateToString: {format: "%d-%m-%Y", date: "$PODate"}}, "-"]},
        supplierInvoiceRefDate: {$dateToString: {format: "%d-%m-%Y", date: "$supplierInvoiceRefDate"}},
        deliveryLocation: 1,
        POStatus: 1,
        remarks: 1,
        createdAt: 1
    };
};
exports.getAllGRNReportsAttributes = () => {
    return {
        GRNNumber: 1,
        GRNDateS: 1,
        PODate: {$ifNull: [{$dateToString: {format: "%d-%m-%Y", date: "$PODate"}}, "-"]},
        supplierInvoiceRefDate: {$dateToString: {format: "%d-%m-%Y", date: "$supplierInvoiceRefDate"}},
        supplierInvoiceRef: 1,
        GRNStatus: 1,
        supplierName: 1,
        PONumber: {$ifNull: ["$PONumber", "-"]},
        supplierCurrency: 1,
        deliveryLocation: 1,
        POStatus: 1,
        company: 1,
        createdAt: 1
    };
};
exports.getAllSupplierWiseReportsAttributes = () => {
    return {
        GRNNumber: 1,
        GRNDateS: 1,
        PODate: {$ifNull: [{$dateToString: {format: "%d-%m-%Y", date: "$PODate"}}, "-"]},
        supplierInvoiceRefDate: {$dateToString: {format: "%d-%m-%Y", date: "$supplierInvoiceRefDate"}},
        supplierInvoiceRef: 1,
        GRNStatus: 1,
        supplierName: {$ifNull: ["$supplierName", "$supplier.supplierName"]},
        PONumber: {$cond: [{$eq: ["$GRNNumber", "0"]}, "0", "$PONumber"]},
        supplierCurrency: 1,
        deliveryLocation: 1,
        POStatus: 1,
        company: 1,
        createdAt: 1
    };
};
exports.getAllStoreItemWiseReportsAttributes = () => {
    return {
        GRNNumber: 1,
        GRNDate: {$dateToString: {format: "%d-%m-%Y", date: "$GRNDate"}},
        itemName: "$GRNDetails.item.itemName",
        itemCode: "$GRNDetails.item.itemCode",
        itemDescription: "$GRNDetails.item.itemDescription",
        UOM: "$GRNDetails.UOM",
        GRNQty: "$GRNDetails.GRNQty",
        invoicedQty: "$GRNDetails.invoicedQty",
        batchDate: {$dateToString: {format: "%d-%m-%Y", date: "$GRNDetails.batchDate"}},
        releasedQty: "$GRNDetails.releasedQty",
        rejectedQty: "$GRNDetails.rejectedQty",
        balancedQty: "$GRNDetails.balancedQty",
        createdAt: 1,
        company: 1,
        deliveryLocation: 1
    };
};
exports.getGRNSummeryReportsAttributes = () => {
    return {
        GRNNumber: 1,
        GRNDateS: 1,
        supplierName: 1,
        supplierCurrency: "$currency",
        totalValue: 1,
        createdAt: 1
    };
};
exports.getGRNDetailReportsAttributes = () => {
    return {
        GRNNumber: 1,
        GRNDateS: 1,
        supplierName: 1,
        supplierCurrency: "$supplier.supplierCurrency",
        itemCode: "$GRNDetails.item.itemCode",
        itemDescription: "$GRNDetails.item.itemDescription",
        Quantity: 1,
        unitPrice: 1,
        createdAt: 1
    };
};
exports.getGRNDiscrepancyReportsAttributes = () => {
    return {
        GRNNumber: 1,
        GRNDateS: 1,
        supplierName: 1,
        PONumber: "$PONumber.PONumber",
        POId: "$PONumber._id",
        itemCode: "$GRNDetails.item.itemCode",
        itemDescription: "$GRNDetails.item.itemDescription",
        POQty: {$toString: "$PONumber.PODetails.POQty"},
        GRNQty: {$toString: "$GRNDetails.GRNQty"},
        discrepancy: {$toString: {$subtract: ["$GRNDetails.GRNQty", "$PONumber.PODetails.POQty"]}},
        createdAt: 1
    };
};
exports.getGRNTrendReportsAttributes = () => {
    return {
        month: 1,
        sortMonth: "$_id.MM",
        totalValue: 1,
        totalGRN: {$toString: "$totalGRN"}
    };
};
exports.getMonthlySupplierEvaluationAttributes = async company => {
    const supplierRules = await getAllSupplierRules(company);
    let onTimeSuppliesWeighage;
    let qualitySuppliesWeighage;
    for (const ele of supplierRules) {
        if (ele.name == "On Time Supplies") {
            onTimeSuppliesWeighage = ele.weight;
        }
        if (ele.name == "Quality Supplies") {
            qualitySuppliesWeighage = ele.weight;
        }
    }
    return {
        supplier: "$supplier._id",
        supplierName: 1,
        totalSupplies: 1,
        onTimeSupplies: 1,
        qualitySupplies: 1,
        onTimeSuppliesRating: {$round: ["$onTimeSuppliesRating", 2]},
        qualitySuppliesRating: {$round: ["$qualitySuppliesRating", 2]},
        totalRating: {
            $round: [
                {
                    $sum: [
                        {
                            $divide: [
                                {
                                    $multiply: ["$onTimeSuppliesRating", onTimeSuppliesWeighage]
                                },
                                100
                            ]
                        },
                        {
                            $divide: [
                                {
                                    $multiply: ["$qualitySuppliesRating", qualitySuppliesWeighage]
                                },
                                100
                            ]
                        }
                    ]
                },
                2
            ]
        }
    };
};
exports.getMonthlyEvaluationBySupplierIdAttributes = () => {
    return {
        totalSupplies: 1,
        onTimeSupplies: 1,
        qualitySupplies: 1,
        onTimeSuppliesRating: 1,
        qualitySuppliesRating: 1,
        onTimeSuppliesActualRating: 1,
        qualitySuppliesActualRating: 1,
        totalRating: {$round: [{$sum: ["$onTimeSuppliesActualRating", "$qualitySuppliesActualRating"]}, 2]}
    };
};
exports.getAllGRNLocationWiseReportsAttributes = () => {
    return {
        GRNNumber: 1,
        GRNDate: {$dateToString: {format: "%d-%m-%Y", date: "$GRNDate"}},
        GRNQty: "$GRNDetails.GRNQty",
        itemCode: "$GRNDetails.item.itemCode",
        itemName: "$GRNDetails.item.itemName",
        itemDescription: "$GRNDetails.item.itemDescription",
        deliveryLocation: 1,
        subLocation: "$storageLocationMapping.subLocation",
        rowNo: "$storageLocationMapping.rowNo",
        rackNo: "$storageLocationMapping.rackNo",
        binNo: "$storageLocationMapping.binNo",
        otherId: "$storageLocationMapping.otherId",
        storageLocationMapping: 1
    };
};
