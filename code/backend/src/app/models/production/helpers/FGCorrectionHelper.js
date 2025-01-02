exports.getAllFGCorrectionAttributes = () => {
    return {
        FGNo: 1,
        FGDate: 1,
        SKU: 1,
        SKUNo: 1,
        SKUDescription: 1,
        correctionCategory: 1,
        sourceBatch: 1,
        transferQty: 1,
        destinationBatch: 1,
        newBatch: 1,
        availableSourceQty: 1,
        createdAt: 1
    };
};
exports.getAllFGCorrectionReportsAttributes = () => {
    return {
        FGDate: {$dateToString: {format: "%d-%m-%Y", date: "$FGDate"}},
        SKUNo: 1,
        SKUName: "$SKU.SKUName",
        SKUDescription: 1,
        correctionCategory: 1,
        sourceBatch: {$dateToString: {format: "%d-%m-%Y", date: "$sourceBatch.manufacturingDate"}},
        transferQty: {$cond: [{$eq: ["$correctionCategory", "Quantity Correction"]}, "$correctedQty", "$transferQty"]},
        correctedQty: 1,
        destinationBatch: {$dateToString: {format: "%d-%m-%Y", date: "$destinationBatch.manufacturingDate"}},
        originalBatchQty: "$availableSourceQty",
        availableSourceQty: {
            $cond: [
                {$eq: ["$correctionCategory", "Quantity Correction"]},
                {
                    $add: ["$availableSourceQty", {$ifNull: ["$correctedQty", 0]}]
                },
                {
                    $subtract: ["$availableSourceQty", {$ifNull: ["$transferQty", 0]}]
                }
            ]
        }
    };
};
