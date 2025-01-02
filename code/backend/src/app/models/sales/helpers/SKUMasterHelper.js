const {CONSTANTS} = require("../../../../config/config");
const {OPTIONS} = require("../../../helpers/global.options");

exports.getAllSKUMasterAttributes = () => {
    return {
        SKUNo: 1,
        SKUStage: 1,
        productCategory: 1,
        SKUName: 1,
        SKUDescription: 1,
        hsn: 1,
        primaryUnit: 1,
        artWorkNo: 1,
        artWorkHyperLink: 1,
        shelfLife: 1,
        // drawingArtWorkFile: 1,
        // productionLayoutFile: 1,
        createdAt: 1,
        isActive: 1,
        status: 1
        // drawingArtWorkFileUrl: {$concat: [CONSTANTS.domainUrl, "Sku/", "$drawingArtWorkFile"]},
        // productionLayoutFileUrl: {$concat: [CONSTANTS.domainUrl, "Sku/", "$productionLayoutFile"]}
    };
};
exports.getAllSKUProdItemMasterAttributes = () => {
    return {
        itemCode: "$SKUNo",
        itemName: "$SKUName",
        itemDescription: "$SKUDescription",
        unitOfMeasurement: "$primaryUnit",
        primaryUnit: 1,
        secondaryUnit: 1,
        primaryToSecondaryConversion: "$primaryToSecondaryConversion",
        secondaryToPrimaryConversion: "$secondaryToPrimaryConversion",
        conversionOfUnits: {
            $cond: [
                {$gt: ["$primaryToSecondaryConversion", 0]},
                {
                    $concat: [
                        "1 ",
                        "$primaryUnit",
                        " = ",
                        {$toString: "$primaryToSecondaryConversion"},
                        " ",
                        "$secondaryUnit"
                    ]
                },
                null
            ]
        },
        unitConversionFlag: 1,
        prodItemCategory: "$productCategory",
        shelfLife: 1,
        BOMLevel: "BL1",
        createdAt: 1,
        inwardTo: "Finished Goods Store",
        prodUnit: 1,
        status: {
            $cond: [{$eq: ["$isActive", "A"]}, OPTIONS.defaultStatus.ACTIVE, OPTIONS.defaultStatus.INACTIVE]
        }
    };
};
exports.getAllSKUMasterReportsAttributes = () => {
    return {
        SKUNo: 1,
        SKUName: 1,
        SKUDescription: 1,
        productCategory: 1,
        primaryUnit: 1,
        isActive: {$cond: [{$eq: ["$isActive", "A"]}, "Active", "Inactive"]},
        customerName: "$customerInfo.customer.customerName",
        customerPartNo: "$customerInfo.customerPartNo",
        standardSellingRate: "$customerInfo.standardSellingRate"
    };
};
exports.getAllSKUMasterExcelAttributes = () => {
    return {
        productCategory: 1,
        SKUNo: 1,
        SKUName: 1,
        SKUStage: 1,
        SKUDescription: 1,
        hsn: 1,
        primaryUnit: 1,
        artWorkNo: 1,
        internalPartNo: 1,
        status: 1,
        isActive: 1,
        customerName: "$customerInfo.customerName",
        customerPartDescription: "$customerInfo.customerPartDescription",
        customerPartNo: "$customerInfo.customerPartNo",
        customerCurrency: "$customerInfo.customerCurrency",
        standardSellingRate: "$customerInfo.standardSellingRate",
        monthlyOffTake: "$customerInfo.monthlyOffTake",
        PONo: "$customerInfo.PONo",
        PODate: "$customerInfo.PODate",
        POValidDate: {$dateToString: {format: "%d-%m-%Y", date: "$customerInfo.POValidDate"}},
        shelfLife: 1,
        storageTemp: 1,
        storageHumidity: 1,
        specialStorageInstruction: 1,
        ADUnit: "$dimensionsDetails.actualDimensions.unit",
        ADWidth: "$dimensionsDetails.actualDimensions.width",
        ADLength: "$dimensionsDetails.actualDimensions.length",
        ADUps: "$dimensionsDetails.actualDimensions.ups",
        ADArea: "$dimensionsDetails.actualDimensions.area",
        ADMtSqArea: "$dimensionsDetails.actualDimensions.mSqArea",
        unit: "$dimensionsDetails.layoutDimensions.unit",
        width: "$dimensionsDetails.layoutDimensions.width",
        length: "$dimensionsDetails.layoutDimensions.length",
        ups: "$dimensionsDetails.layoutDimensions.ups",
        area: "$dimensionsDetails.layoutDimensions.area",
        mSqArea: "$dimensionsDetails.layoutDimensions.mSqArea",
        wastePercentage: "$dimensionsDetails.layoutDimensions.wastePercentage"
        // drawingArtWorkFileUrl: {
        //     $cond: [{$not: ["$drawingArtWorkFile"]}, "No", "Yes"]
        // },
        // productionLayoutFileUrl: {
        //     $cond: [{$not: ["$productionLayoutFile"]}, "No", "Yes"]
        // }
    };
};

exports.getAllSKUAttributes = () => {
    return {
        SKUNo: 1,
        SKUName: 1,
        SKUDescription: 1,
        primaryUnit: 1,
        productCategory: 1,
        SKUStage: 1,
        SKUDimStatus: {$ifNull: ["$SKUDimStatus", OPTIONS.defaultStatus.INACTIVE]},
        SKUMaterialStatus: {$ifNull: ["$SKUMaterialStatus", OPTIONS.defaultStatus.INACTIVE]},
        SKUInkStatus: {$ifNull: ["$SKUInkStatus", OPTIONS.defaultStatus.INACTIVE]},
        SKUAttributesStatus: {$ifNull: ["$SKUAttributesStatus", OPTIONS.defaultStatus.INACTIVE]},
        dimensionsDetails: 1
    };
};
exports.getSKUListForStockLevelsAttributes = () => {
    return {
        SKUNo: 1,
        SKUName: 1,
        SKUDescription: 1,
        primaryUnit: 1,
        productCategory: 1,
        status: 1,
        SKUStockLevels: 1,
        reorderLevel: "$SKUStockLevels.reorderLevel",
        reorderQty: "$SKUStockLevels.reorderQty",
        minLevel: "$SKUStockLevels.minLevel",
        maxLevel: "$SKUStockLevels.maxLevel"
    };
};
