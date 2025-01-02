const {ObjectId} = require("../../../../../../config/mongoose");
const BoMOfSKURepository = require("../../../../../models/planning/repository/BOMRepository/BoMOfSKURepository");

exports.bulkMigrateBOMOfSKU = async companyId => {
    try {
        let bulkJSON = await BoMOfSKURepository.filteredBoMOfSKUList([
            {$match: {company: ObjectId(companyId)}},
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "SKU",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $lookup: {
                                from: "SKUCategory",
                                localField: "productCategory",
                                foreignField: "displayProductCategoryName",
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 0,
                                            SKUCategoryPrefix: 1,
                                            BOMPrefix: 1
                                        }
                                    }
                                ],
                                as: "SKUCategoryInfo"
                            }
                        },
                        {$unwind: "$SKUCategoryInfo"},
                        {
                            $project: {
                                _id: 0,
                                SKUCategoryPrefix: "$SKUCategoryInfo.SKUCategoryPrefix",
                                BOMPrefix: "$SKUCategoryInfo.BOMPrefix"
                            }
                        }
                    ],
                    as: "SKU"
                }
            },
            {$unwind: "$SKU"},
            {
                $project: {
                    SKUCategoryPrefix: "$SKU.SKUCategoryPrefix",
                    BOMPrefix: "$SKU.BOMPrefix",
                    supplierPurchaseType: 1,
                    supplierCode: 1,
                    _id: 1
                }
            }
        ]);
        for (const obj of bulkJSON) {
            await BoMOfSKURepository.findAndUpdateDoc(
                {_id: obj._id},
                {
                    supplierCode: obj.supplierCode,
                    supplierPurchaseType: obj.supplierPurchaseType,
                    categoryType: isDomestic ? SALES_CATEGORY.DOMESTIC : SALES_CATEGORY.IMPORTS
                }
            );
        }
        console.log("Supplier Category Updated SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};

const bulkUpdateBOMCalculation = async () => {
    try {
        let bulkJSON = await BoMOfSKURepository.filteredBoMOfSKUList([
            {
                $project: {
                    partCount: 1,
                    totalMaterialCost: 1,
                    materialCostForOnePC: 1,
                    BOMOfSKUDetails: 1,
                    _id: 1
                }
            }
        ]);
        for (const obj of bulkJSON) {
            obj.BOMOfSKUDetails = obj?.BOMOfSKUDetails?.map(x => {
                x.partCount = x.qtyPerSKUUnit + (x.qtyPerSKUUnit * x.wastePercentage) / 100 ?? 0;
                x.itemCost = x?.unitCost * x?.partCount ?? 0;
                return x;
            });
            obj.materialCostForOnePC = obj?.BOMOfSKUDetails?.map(y => y.itemCost)?.reduce((a, c) => a + c, 0) ?? 0;
            obj.totalMaterialCost = obj?.materialCostForOnePC * obj?.partCount;
            await BoMOfSKURepository.findAndUpdateDoc(
                {_id: obj._id},
                {
                    BOMOfSKUDetails: obj.BOMOfSKUDetails,
                    materialCostForOnePC: obj?.materialCostForOnePC ?? 0,
                    totalMaterialCost: obj?.totalMaterialCost ?? 0
                }
            );
        }
        console.log("BOM Calculation Updated Successfully");
    } catch (error) {
        console.error("error", error);
    }
};

// bulkUpdateBOMCalculation().then(console.log("-------------"));
