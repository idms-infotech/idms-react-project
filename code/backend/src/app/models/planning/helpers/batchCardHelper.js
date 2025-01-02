const {OPTIONS} = require("../../../helpers/global.options");

exports.getAllBatchCardAttributes = () => {
    return {
        batchCardId: {$ifNull: ["$batchCard.batchCardId", null]},
        categoryCode: "$itemCategoryInfo.categoryCode",
        item: "$_id",
        itemCode: 1,
        itemName: 1,
        itemDescription: 1,
        UOM: {$ifNull: ["$unitOfMeasurement", "$batchCard.UOM"]},
        AMC: {$ifNull: ["$stockLevels.avgMonthlyConsumption", 0]},
        RPL: {$ifNull: ["$stockLevels.reorderLevel", 0]},
        minL: {$ifNull: ["$stockLevels.minLevel", 0]},
        maxL: {$ifNull: ["$stockLevels.maxLevel", 0]},
        itemCategory: "$prodItemCategory",
        SOH: {$ifNull: [{$round: ["$invInfo.closedIRQty", 0]}, 0]},
        batchQty: {$ifNull: ["$batchCard.batchQty", 0]},
        lastBatchQty: {$ifNull: ["$batchCard.lastBatchQty", 0]},
        stockLevelQty: {$ifNull: ["$stockLevels.manufacturingBatchSize", 0]},
        prodUnitConfig: {$ifNull: ["$batchCard.prodUnitConfig", "$prodUnitId"]},
        productionUnit: {$ifNull: ["$batchCard.productionUnit", null]},
        batchCardNo: {$ifNull: ["$batchCard.batchCardNo", null]},
        batchCardDate: {$ifNull: ["$batchCard.batchCardDate", null]},
        status: {$ifNull: ["$batchCard.status", OPTIONS.defaultStatus.INACTIVE]},
        prodProcessFlowExists: {$cond: [{$gt: [{$size: "$prodProcessFlow"}, 0]}, true, false]},
        BOMOfProdItemExists: {$cond: [{$gt: [{$size: "$BOMOfProdItemInfo"}, 0]}, true, false]}
    };
};
exports.getAllBCInkAttributes = () => {
    return {
        _id: 0,
        item: "$_id",
        batchCard: 1,
        prodUnitConfig: 1,
        batchCardNo: 1,
        batchCardDate: {$dateToString: {format: "%d-%m-%Y", date: "$batchCardDate"}},
        itemCode: 1,
        itemName: 1,
        itemDescription: 1,
        UOM: 1,
        batchCode: 1,
        batchQty: 1,
        inventoryZone: "$batchCardEntry.inventoryZone",
        generateReport: "$batchCardEntry.generateReport",
        BCEntryStatus: {
            $cond: [
                {
                    $not: ["$batchCardEntry.checkoutStatus"]
                },
                OPTIONS.defaultStatus.INACTIVE,
                "$batchCardEntry.checkoutStatus"
            ]
        }
    };
};
