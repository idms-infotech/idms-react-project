const {CONSTANTS} = require("../../../../config/config");

exports.getAllCGMAttributes = () => {
    return {
        capitalGoodsName: 1,
        capitalGoodsDescription: 1,
        capitalGoodsSpecification: 1,
        hsnCode: "$hsnCode.hsnCode",
        UOM: 1,
        capitalGoodsNo: 1,
        technicalSheetFile: 1,
        createdAt: 1,
        technicalSheetFileUrl: {$concat: [CONSTANTS.domainUrl, "technicalSheet/", "$technicalSheetFile"]}
    };
};
exports.getAllCGMExcelAttributes = () => {
    return {
        capitalGoodsNo: 1,
        capitalGoodsName: 1,
        capitalGoodsDescription: 1,
        capitalGoodsSpecification: 1,
        hsnCode: "$hsnCode.hsnCode",
        UOM: 1,
        supplierPartNo: "$supplierInfo.supplierPartNo",
        currency: "$supplierInfo.currency",
        purchaseCost: "$supplierInfo.purchaseCost"
    };
};
