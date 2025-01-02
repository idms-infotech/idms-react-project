const {STOCK_PREP_UOM} = require("../../../mocks/constantData");

exports.getAllSFGStockAttributes = () => {
    return {
        MRN: 1,
        MRNNumber: 1,
        GIN: 1,
        GINDate: 1,
        item: 1,
        itemCode: 1,
        itemName: 1,
        itemDescription: 1,
        UOM: STOCK_PREP_UOM.SQM,
        status: 1,
        _id: 1,
        department: 1,
        deliveryLocation: 1,
        type: "SFGStock",
        expiryDate: 1,
        conversionOfUnits: 1,
        primaryToSecondaryConversion: 1,
        secondaryToPrimaryConversion: 1,
        primaryUnit: 1,
        secondaryUnit: 1,

        closedIRQty: {
            $cond: [
                {$eq: ["$UOM", STOCK_PREP_UOM.SQM]},
                "$closedIRQty",
                {
                    $round: [
                        {
                            $multiply: ["$closedIRQty", "$SQM"]
                        },
                        2
                    ]
                }
            ]
        },
        width: {$ifNull: ["$width", 0]},
        length: {$ifNull: ["$length", 0]},
        SQM: {$ifNull: ["$SQM", 0]},
        roll: {
            $cond: [
                {$eq: ["$SQM", 0]},
                0,
                {
                    $cond: [
                        {$eq: ["$UOM", STOCK_PREP_UOM.SQM]},
                        {
                            $round: [
                                {
                                    $divide: ["$closedIRQty", {$ifNull: ["$SQM", 1]}]
                                },
                                2
                            ]
                        },
                        "$closedIRQty"
                    ]
                }
            ]
        },
        supplier: 1,
        itemType: 1,
        standardRate: 1,
        purchaseRate: 1,
        purchaseRateUSD: 1,
        purchaseRatINR: 1,
        lineValueINR: 1,
        batchDate: 1,
        storageLocationMapping: 1,
        MRNDate: 1
    };
};
exports.getAllSFGStockReportsAttributes = () => {
    return {
        MRNNumber: 1,
        itemCode: 1,
        itemName: 1,
        itemDescription: 1,
        UOM: 1,
        GINDate: {$dateToString: {format: "%d-%m-%Y", date: "$GINDate"}},
        stage: 1,
        WXL: {
            $cond: [{$eq: ["$stage", STOCK_PREP_UOM.ROLL]}, "mm x  mtr", "mm x mm"]
        },
        width: 1,
        length: 1,
        noOfSlits: "$roll",
        sqmPerRoll: "$SQM",
        sqmTotal: "$PPICQty",
        expiryDate: 1,
        createdAt: 1
    };
};
