const {CONSTANTS} = require("../../../../config/config");
const {OPTIONS} = require("../../../helpers/global.options");

exports.getAllItemAttributes = () => {
    return {
        isActive: "$isActive",
        itemCode: 1,
        itemDescription: 1,
        itemName: 1,
        orderInfoUOM: 1,
        primaryUnit: 1,
        secondaryUnit: 1,
        primaryToSecondaryConversion: 1,
        secondaryToPrimaryConversion: 1,
        hsn: 1,
        QCLevels: 1,
        shelfLife: 1
    };
};
exports.getAllItemExcelAttributes = () => {
    return {
        isActive: {$cond: [{$eq: ["$isActive", "A"]}, OPTIONS.defaultStatus.ACTIVE, OPTIONS.defaultStatus.INACTIVE]},
        itemCode: 1,
        itemName: 1,
        itemType: 1,
        perishableGoods: 1,
        storageTemp: 1,
        storageHumidity: 1,
        specialStorageInstruction: 1,
        generalSpecification: 1,
        itemDescription: 1,
        dimWidth: "$dualUnitsDimensionsDetails.width",
        widthUnitUOM: "$dualUnitsDimensionsDetails.widthUnit",
        dimLength: "$dualUnitsDimensionsDetails.length",
        lengthUnitUOM: "$dualUnitsDimensionsDetails.lengthUnit",
        hsn: 1,
        supplierName: "$supplierDetails.supplierName",
        supplierDescription: "$supplierDetails.supplierDescription",
        supplierCurrency: "$supplierDetails.supplierCurrency",
        spin: "$supplierDetails.spin",
        uom1: "$supplierDetails.uom1",
        uom2: "$supplierDetails.uom2",
        stdCostUom1: "$supplierDetails.stdCostUom1",
        stdCostUom2: "$supplierDetails.stdCostUom2",
        primaryUnit: 1,
        secondaryUnit: 1,
        QCLevels: 1,
        shelfLife: 1,
        itemAMU: 1,
        itemROL: 1,
        tdsFile: 1,
        msdsFile: 1,
        drawing: 1,
        createdAt: 1,
        orderInfoUOM: 1,
        conversionOfUnits: 1,
        tdsFileUrl: {
            $cond: [{$not: ["$tdsFile"]}, "No", "Yes"]
        },
        msdsFileUrl: {
            $cond: [{$not: ["$msdsFile"]}, "No", "Yes"]
        }
    };
};
exports.getAllItemReportsAttributes = () => {
    return {
        supplier: "$supplierDetails.supplierId._id",
        supplierName: "$supplierDetails.supplierId.supplierName",
        supplierDescription: "$supplierDetails.supplierId.supplierDescription",
        unitPrice: 1,
        currency: "$supplierDetails.supplierCurrency",
        itemCode: 1,
        itemName: 1,
        itemType: 1,
        itemAMU: 1,
        itemROL: 1,
        orderInfoUOM: 1
    };
};
exports.getAllForStockLevelAttributes = () => {
    return {
        itemCode: 1,
        itemName: 1,
        itemDescription: 1,
        conversionOfUnits: 1,
        orderInfoUOM: 1,
        primaryUnit: 1,
        secondaryUnit: 1,
        // itemROL: 1,
        // itemAMU: 1,
        reorderLevel: "$inventoryStockLevels.reorderLevel",
        reorderQty: "$inventoryStockLevels.reorderQty",
        minLevel: "$inventoryStockLevels.minLevel",
        maxLevel: "$inventoryStockLevels.maxLevel",
        inventoryStockLevels: 1,
        status: 1,
     
    };
};
