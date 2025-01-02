exports.getAllDeliveryChallanAttributes = () => {
    return {
        DCNo: 1,
        DCDate: {$dateToString: {format: "%d-%m-%Y", date: "$DCDate"}},
        nameOfConsignor: 1,
        nameOfConsignee: 1,
        placeOfSupply: 1,
        totalGoodsValue: 1,
        status: 1
    };
};
exports.getAllDeliveryChallanReportsAttributes = () => {
    return {
        DCNo: 1,
        DCDate: {$dateToString: {format: "%d-%m-%Y", date: "$DCDate"}},
        nameOfConsignor: 1,
        nameOfConsignee: 1,
        placeOfSupply: 1,
        totalGoodsValue: 1,
        status: 1,
        ewayBillNo: 1,
        EWayBillPdfUrl: 1,
        EWayBillQrCodeUrl: 1,
        eWayBillStatus: 1,
    };
};
