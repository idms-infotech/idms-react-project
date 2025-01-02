exports.getAllSalesForecastAttributes = () => {
    return {
        FCNo: 1,
        FCDate: {$dateToString: {format: "%d-%m-%Y", date: "$FCDate"}},
        customerCategory: 1,
        customerName: 1,
        netFCValue: 1,
        currency: 1,
        status: 1,
        FCType: 1
    };
};
exports.getAllSalesForecastReportsAttributes = () => {
    return {
        FCNo: 1,
        FCDate: {$dateToString: {format: "%d-%m-%Y", date: "$FCDate"}},
        SKUName: "$salesForecastDetails.SKU.SKUName",
        SKUNo: "$salesForecastDetails.SKU.SKUNo",
        SKUDescription: "$salesForecastDetails.SKU.SKUDescription",
        customerPartNo: "$salesForecastDetails.customerPartNo",
        UOM: "$salesForecastDetails.UOM",
        currency: 1,
        netRate: "$salesForecastDetails.netRate",
        lineValue: "$salesForecastDetails.lineValue",
        scheduleNo: "$salesForecastDetails.releaseSchedule.scheduleNo",
        quantity: "$salesForecastDetails.releaseSchedule.quantity",
        dispatchDate: {
            $dateToString: {format: "%d-%m-%Y", date: "$salesForecastDetails.releaseSchedule.dispatchDate"}
        },
        customerName: {
            $cond: {
                if: {
                    $or: [{$eq: ["$customer.customerNickName", null]}, {$eq: ["$customer.customerNickName", ""]}]
                },
                then: "$customerName",
                else: "$customer.customerNickName"
            }
        }
    };
};
