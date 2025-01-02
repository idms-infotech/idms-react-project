const BOMOfJobWorkItemRepository = require("../../../../models/planning/repository/BOMOfJobWorkItemRepository");

const bulkUpdateBOMCalculation = async () => {
    try {
        let bulkJSON = await BOMOfJobWorkItemRepository.filteredBOMOfJobWorkItemList([
            {
                $project: {
                    partCount: 1,
                    totalMaterialCost: 1,
                    materialCostForOnePC: 1,
                    BOMOfJobWorkItemInfo: 1,
                    _id: 1
                }
            }
        ]);
        for (const obj of bulkJSON) {
            obj.BOMOfJobWorkItemInfo = obj?.BOMOfJobWorkItemInfo?.map(x => {
                x.totalQtyPerPC = x.qtyPerPartCount + (x.qtyPerPartCount * x.wastePercentage) / 100 ?? 0;
                x.itemCost = x?.unitCost * x?.totalQtyPerPC ?? 0;
                return x;
            });
            obj.materialCostForOnePC = obj?.BOMOfJobWorkItemInfo?.map(y => y.itemCost)?.reduce((a, c) => a + c, 0) ?? 0;
            obj.totalMaterialCost = obj?.materialCostForOnePC * obj?.partCount;
            await BOMOfJobWorkItemRepository.findAndUpdateDoc(
                {_id: obj._id},
                {
                    BOMOfJobWorkItemInfo: obj.BOMOfJobWorkItemInfo,
                    materialCostForOnePC: obj?.materialCostForOnePC ?? 0,
                    totalMaterialCost: obj?.totalMaterialCost ?? 0
                }
            );
        }
        console.log("BOM JW Item Calculation Updated Successfully");
    } catch (error) {
        console.error("error", error);
    }
};

// bulkUpdateBOMCalculation().then(console.log("-------------"));
