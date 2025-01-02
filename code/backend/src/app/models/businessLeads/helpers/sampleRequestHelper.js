exports.getAllSampleRequestAttributes = () => {
    return {
        sampleReqNo: 1,
        SRDate: {$dateToString: {format: "%d-%m-%Y", date: "$SRDate"}},
        salesCategory: 1,
        customerName: 1,
        currency: 1,
        SRTotalAmount: 1,
        SRStatus: 1
    };
};

exports.getAllSampleReqReportsAttributes = () => {
    return {
        SONumber: "$sampleReqNo",
        SODate: {$dateToString: {format: "%d-%m-%Y", date: "$SRDate"}},
        SKUName: "$SRDetails.SKU.SKUName",
        SKUNo: "$SRDetails.SKU.SKUNo",
        SKUDescription: "$SRDetails.SKU.SKUDescription",
        customerPartNo: "$SRDetails.customerPartNo",
        currency: 1,
        UOM: "$SRDetails.UOM",
        netRate: "$SRDetails.netRate",
        lineValue: {$round: [{$multiply: ["$SRDetails.netRate", "$SRDetails.dispatchSchedule.quantity"]}, 2]},
        customerName: "$customer.customerName",
        scheduleNo: "$SRDetails.dispatchSchedule.scheduleNo",
        quantity: "$SRDetails.dispatchSchedule.quantity",
        dispatchDate: {$dateToString: {format: "%d-%m-%Y", date: "$SRDetails.dispatchSchedule.dispatchDate"}},
        company: 1,
        SRStatus: 1,
        createdAt: 1,
        customerName: {
            $cond: {
                if: {
                    $or: [{$eq: ["$customer.customerNickName", null]}, {$eq: ["$customer.customerNickName", ""]}]
                },
                then: "$customer.customerName",
                else: "$customer.customerNickName"
            }
        }
    };
};
