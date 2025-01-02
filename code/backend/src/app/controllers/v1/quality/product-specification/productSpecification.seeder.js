const ProductSpecificationRepository = require("../../../../models/quality/repository/productSpecificationRepository");

const bulkMigrateProdSpecification = async () => {
    try {
        const toUpdateList = await ProductSpecificationRepository.filteredProductSpecificationList([
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "SKU",
                    foreignField: "_id",
                    pipeline: [{$project: {productCategory: 1}}],
                    as: "SKUInfo"
                }
            },
            {$unwind: "$SKUInfo"},
            {
                $project: {
                    _id: 1,
                    productCategory: "$SKUInfo.productCategory"
                }
            }
        ]);
        console.log("toUpdateList", toUpdateList, toUpdateList.length);
        for await (const ele of toUpdateList) {
            await ProductSpecificationRepository.findAndUpdateDoc(
                {_id: ele?._id},
                {
                    $set: {
                        productCategory: ele?.productCategory
                    }
                }
            );
        }
        console.log("Product Specification Migration completed");
    } catch (error) {
        console.error("error", error);
    }
};

// bulkMigrateProdSpecification().then(console.log("Product Specification"));
