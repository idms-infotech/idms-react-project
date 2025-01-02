exports.getAllInterProdStoreAttributes = () => {
    return {
        company: 0
    };
};
exports.getAllInterProdStoreReportsAttributes = () => {
    return {
        itemCode: 1,
        itemName: 1,
        itemDescription: 1,
        UOM: 1,
        qty: 1,
        unitRate: 1,
        value: 1,
        batchDate: {$dateToString: {format: "%d-%m-%Y", date: "$batchDate"}},
        invZoneName: 1,
        location: 1,
        aging: {
            $cond: {
                if: {
                    $or: [
                        {$eq: ["$expiryDate", null]},
                        {$gte: ["$expiryDate", {$add: [new Date(), 30 * 24 * 60 * 60 * 1000]}]}
                    ]
                },
                then: "green",
                else: {
                    $cond: {
                        if: {
                            $gt: ["$expiryDate", new Date()]
                        },
                        then: "orange",
                        else: "red"
                    }
                }
            }
        }
    };
};
