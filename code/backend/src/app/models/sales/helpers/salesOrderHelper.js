exports.getAllSalesOrderAttributes = extra => {
    return {
        SONumber: 1,
        PONumber: 1,
        salesCategory: 1,
        customerName: "$customer.customerName",
        currency: 1,
        SOTotalAmount: 1,
        SODateS: 1,
        createdAt: 1,
        SOStatus: 1,
        ...extra
    };
};
exports.getBackSalesOrderBySKUAttributes = () => {
    return {
        SKUName: "$SKU.SKUName",
        SKUNo: "$SKU.SKUNo",
        SKUDescription: "$SKU.SKUDescription",
        balanceValue: 1,
        company: 1,
        SOStatus: 1,
        balancedQty: 1,
        createdAt: 1
    };
};
exports.getBackSalesOrderBySOAttributes = () => {
    return {
        SODateS: 1,
        SONumber: 1,
        line: 1,
        SKUName: "$SKU.SKUName",
        SKUNo: "$SKU.SKUNo",
        SKUDescription: "$SKU.SKUDescription",
        balancedQty: 1,
        lineValue: 1,
        customerName: "$customerDetails.customerName",
        SOLineTargetDateS: 1,
        SOStatus: 1,
        SODate: 1,
        SOLineTargetDate: 1,
        company: 1,
        createdAt: 1,
        PONumber: 1
    };
};

exports.getAllSOConfirmationReportsAttributes = () => {
    return {
        SONumber: 1,
        PONumber: 1,
        salesCategory: 1,
        customerName: "$customer.customerName",
        currency: 1,
        SOTotalAmount: 1,
        SODateS: {$dateToString: {format: "%d-%m-%Y", date: "$SODate"}},
        createdAt: 1,
        SOStatus: 1,
        SOTotalAmount: "$SOTotalAmount"
    };
};

exports.getAllSOSummaryReportsAttributes = () => {
    return {
        customerName: "$customer.customerName",
        dateRange: {
            $concat: [
                {$dateToString: {format: "%d-%m-%Y", date: "$SODateMin"}},
                "/",
                {$dateToString: {format: "%d-%m-%Y", date: "$SODateMax"}}
            ]
        },
        salesCategory: 1,
        currency: 1,
        totalOrders: 1,
        totalAmount: 1,
        avgOrderValue: 1
    };
};
exports.getAllSOCostAnalysisReportsAttributes = () => {
    return {
        SKUName: "$SKU.SKUName",
        customerName: "$customer.customerName",
        currency: 1,
        dateRange: {
            $concat: [
                {$dateToString: {format: "%d-%m-%Y", date: "$SODateMin"}},
                "/",
                {$dateToString: {format: "%d-%m-%Y", date: "$SODateMax"}}
            ]
        },
        totalOrders: 1,
        totalTotalCost: 1,
        averageCost: {$round: ["$averageCost", 2]},
        minCost: 1,
        maxCost: 1
    };
};
exports.getAllSalesOrderReportsAttributes = () => {
    return {
        SONumber: 1,
        SODate: {$dateToString: {format: "%d-%m-%Y", date: "$SODate"}},
        SKUName: "$SODetails.SKU.SKUName",
        SKUNo: "$SODetails.SKU.SKUNo",
        SKUDescription: "$SODetails.SKU.SKUDescription",
        customerPartNo: "$SODetails.customerPartNo",
        currency: 1,
        UOM: "$SODetails.UOM",
        netRate: "$SODetails.netRate",
        lineValue: {$round: [{$multiply: ["$SODetails.netRate", "$dispatchSchedule.quantity"]}, 2]},
        customerName: "$customer.customerName",
        scheduleNo: "$dispatchSchedule.scheduleNo",
        quantity: "$dispatchSchedule.quantity",
        dispatchDate: "$dispatchSchedule.dispatchDate",
        company: 1,
        SOStatus: 1,
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

exports.getAllSalesOrderStatusReportsAttributes = () => {
    return {
        SONumber: 1,
        PONumber: 1,
        SODate: {$dateToString: {format: "%d-%m-%Y", date: "$SODate"}},
        SKUName: "$SODetails.SKU.SKUName",
        SKUNo: "$SODetails.SKU.SKUNo",
        SKUDescription: "$SODetails.SKU.SKUDescription",
        customerPartNo: "$SODetails.customerPartNo",
        UOM: "$SODetails.UOM",
        dispatchCount: "$SODetails.dispatchCount",
        dispatchSchedule: {
            $cond: {
                if: {
                    $and: [
                        {$not: [["$SODetails.dispatchSchedule"]]},
                        {$gt: [{$size: "$SODetails.dispatchSchedule"}, 0]}
                    ]
                },
                then: "$SODetails.dispatchSchedule",
                else: [
                    {
                        scheduleNo: 1,
                        quantity: "$SODetails.orderedQty",
                        dispatchDate: "$SODetails.SOLineTargetDate"
                    }
                ]
            }
        },
        lineValue: {
            $round: [
                {$multiply: [{$toDouble: "$selectedCustomerInfo.standardSellingRate"}, "$SODetails.previousDRNQty"]},
                2
            ]
        },
        SOQty: "$SODetails.orderedQty",
        SObalQty: "$SODetails.balancedQty",
        dispatchQty: "$SODetails.previousDRNQty",
        customerName: "$customer.customerName",
        company: 1,
        SOStatus: 1,
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

exports.getSOLineWiseAttributes = () => {
    return {
        SONumber: 1,
        SODate: {$dateToString: {format: "%d-%m-%Y", date: "$SODate"}},
        SKUName: "$SKU.SKUName",
        SKUNo: "$SKU.SKUNo",
        SKUDescription: "$SKU.SKUDescription",
        UOM: "$SODetails.UOM",
        customerName: "$customerDetails.customerName",
        SOQty: "$SODetails.orderedQty"
    };
};
