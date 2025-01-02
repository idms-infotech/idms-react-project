const {OPTIONS} = require("../../../helpers/global.options");

exports.getAllJobCardEntryAttributes = () => {
    return {
        company: 0
    };
};

exports.getAllJobCardEntryRejectAttributes = () => {
    return {
        _id: "$jobCard",
        jobCardNo: 1,
        SKUNo: 1,
        SKUName: 1,
        SKUDescription: 1,
        UOM: 1,
        batchDate: {$dateToString: {format: "%d-%m-%Y", date: "$batchDate"}},
        batchInputQty: {$ifNull: ["$generateReport.batchInputQty", 0]},
        batchOutputQty: {$ifNull: ["$generateReport.batchOutputQty", 0]},
        batchRejQty: {$ifNull: ["$generateReport.batchRejQty", 0]},
        status: 1
    };
};
