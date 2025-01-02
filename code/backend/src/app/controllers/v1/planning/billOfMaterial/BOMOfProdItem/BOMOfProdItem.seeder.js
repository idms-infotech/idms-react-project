const BOMOfProdItemRepository = require("../../../../../models/planning/repository/BOMRepository/BOMOfProdItemRepository");

const bulkUpdateBOMCalculation = async () => {
    try {
        let bulkJSON = await BOMOfProdItemRepository.filteredBOMOfProdItemList([
            {
                $project: {
                    partCount: 1,
                    totalMaterialCost: 1,
                    materialCostPerUnit: 1,
                    BOMOfProdItemDetails: 1,
                    _id: 1
                }
            }
        ]);
        for (const obj of bulkJSON) {
            obj.BOMOfProdItemDetails = obj?.BOMOfProdItemDetails?.map(x => {
                x.totalQtyPerPC = x.qtyPerPC + (x.qtyPerPC * x.wastePercentage) / 100 ?? 0;
                x.itemCost = x?.ratePerUnit * x?.totalQtyPerPC ?? 0;
                return x;
            });
            obj.materialCostPerUnit = obj?.BOMOfProdItemDetails?.map(y => y.itemCost)?.reduce((a, c) => a + c, 0) ?? 0;
            obj.totalMaterialCost = obj?.materialCostPerUnit * obj?.partCount;
            await BOMOfProdItemRepository.findAndUpdateDoc(
                {_id: obj._id},
                {
                    BOMOfProdItemDetails: obj.BOMOfProdItemDetails,
                    materialCostPerUnit: obj?.materialCostPerUnit ?? 0,
                    totalMaterialCost: obj?.totalMaterialCost ?? 0
                }
            );
        }
        console.log("BOM Prod Item Calculation Updated Successfully");
    } catch (error) {
        console.error("error", error);
    }
};

// bulkUpdateBOMCalculation().then(console.log("-------------"));
