const {OPTIONS} = require("../../../helpers/global.options");

exports.getAllJobCardAttributes = () => {
    return {
        jobCardNo: 1,
        SKUNo: "$_id.SKUNo",
        _id: "$_id.jobCardNoId",
        batchQty: 1,
        jobCardDate: 1,
        customerNickName: 1,
        SKUName: 1,
        SKUDescription: 1,
        UOM: 1,
        status: 1
    };
};

exports.getAllJobCardReportAttributes = () => {
    return {
        jobCardNo: 1,
        SKUNo: "$_id.SKUNo",
        _id: "$_id.jobCardNoId",
        batchQty: 1,
        jobCardDate: 1,
        customerNickName: 1,
        SKUName: 1,
        SKUDescription: 1,
        UOM: 1,
        status: 1,
        orderType: 1
    };
};
exports.getAllSOForJCAttributes = () => {
    return {
        _id: "$_id.jobCard",
        SONumber: 1,
        customerId: "$_id.customer",
        SOId: "$_id.SOId",
        SODate: {$dateToString: {format: "%d-%m-%Y", date: "$SODate"}},
        SKUId: "$_id.SKU",
        SKUName: "$SKU.SKUName",
        SKUNo: "$SKU.SKUNo",
        drawing: "$SKU.drawing",
        SKUDescription: "$SKU.SKUDescription",
        UOM: 1,
        customerName: {
            $cond: [
                {$and: ["$customer.customerNickName", {$ne: ["$customer.customerNickName", ""]}]},
                "$customer.customerNickName",
                "$customer.customerName"
            ]
        },
        balanceQty: 1,
        FGINQty: {$ifNull: ["$FGIN.FGINQuantity", 0]},
        inProcessQty: {$ifNull: ["$jobCardCreation.inProcessQty", 0]},
        jobCardCreation: 1,
        status: {
            $cond: [
                "$jobCardCreation.status",
                {
                    $cond: [
                        {$eq: ["$jobCardCreation.status", OPTIONS.defaultStatus.REPORT_GENERATED]},
                        OPTIONS.defaultStatus.IN_PROGRESS,
                        {
                            $cond: [
                                {$eq: ["$jobCardCreation.status", OPTIONS.defaultStatus.APPROVED]},
                                OPTIONS.defaultStatus.APPROVED,
                                OPTIONS.defaultStatus.AWAITING_APPROVAL
                            ]
                        }
                    ]
                },
                OPTIONS.defaultStatus.INACTIVE
            ]
        }
    };
};
