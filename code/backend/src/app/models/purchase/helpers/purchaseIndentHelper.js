exports.getAllPurchaseIndentAttributes = () => {
    return {
        indentOrderNo: 1,
        indentOrderDate: {$dateToString: {format: "%Y-%m-%d", date: "$indentOrderDate"}},
        purchaseCategory: 1,
        channelPartnerName: 1,
        currency: 1,
        netPIValue: 1,
        status: 1
    };
};

exports.getAllPurchaseIndentReportsAttributes = () => {
    return {
        _id: 1,
        indentOrderNo: 1,
        indentOrderDates: 1,
        purchaseCategory: 1,
        currency: 1,
        channelPartnerName: "$channelPartner.channelPartnerName",
        netPIValue: {$round: ["$netPIValue", 2]},
        status: 1,
        createdAt: 1,
        // indentDetails: 1
        // totalAmountWithTax: {
        //     $round: [
        //         {
        //             $sum: ["$netPIValue"]
        //         },
        //         2
        //     ]
        // }
    };
};
