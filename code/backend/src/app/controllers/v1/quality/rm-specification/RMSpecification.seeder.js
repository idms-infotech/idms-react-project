const RMSpecificationRepository = require("../../../../models/quality/repository/rmSpecificationRepository");

const bulkMigrateRMSpecification = async () => {
    try {
        const toUpdateList = await RMSpecificationRepository.filteredRMSpecificationList([
            {
                $lookup: {
                    from: "Items",
                    localField: "item",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, itemType: 1}}],
                    as: "itemInfo"
                }
            },
            {
                $unwind: "$itemInfo"
            },
            {
                $project: {
                    _id: 1,
                    itemType: "$itemInfo.itemType"
                }
            }
        ]);
        console.log("toUpdateList", toUpdateList, toUpdateList.length);

        for await (const ele of toUpdateList) {
            await RMSpecificationRepository.findAndUpdateDoc(
                {_id: ele?._id},
                {
                    $set: {
                        itemCategory: ele?.itemType
                    }
                }
            );
        }
        console.log("RM Specification Migration completed");
    } catch (error) {
        console.error("error", error);
    }
};

// bulkMigrateRMSpecification().then(console.log("RM Specification"));
