const {OPTIONS} = require("../../../helpers/global.options");

exports.getAllHSNAttributes = () => {
    return {
        hsnCode: 1,
        goodsDescription: 1,
        gstRate: 1,
        igstRate: 1,
        sgstRate: 1,
        cgstRate: 1,
        ugstRate: 1,
        createdAt: 1,
        revisionHistory: 1,
        isActive: 1,
        revisionInfo: 1,
        revisionNo: {$concat: ["Rev", " ", {$toString: "$revisionInfo.revisionNo"}]}
    };
};
exports.getAllHSNExcelAttributes = () => {
    return {
        hsnCode: 1,
        goodsDescription: 1,
        gstRate: 1,
        igstRate: 1,
        sgstRate: 1,
        cgstRate: 1,
        ugstRate: 1,
        revisionNo: {$concat: ["Rev", " ", {$toString: "$revisionInfo.revisionNo"}]},
        revisionDate: {$dateToString: {format: "%d-%m-%Y", date: "$revisionInfo.revisionDate"}},
        createdAt: 1
    };
};
