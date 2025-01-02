const DRNRepository = require("../../../../models/sales/repository/dispatchRequestNoteRepository");

exports.migrateDRNData = async () => {
    try {
        let bulkJSON = await DRNRepository.filteredDRNList([
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {customerCategory: 1, categoryType: 1}}],
                    as: "customerInfo"
                }
            },
            {$unwind: "$customerInfo"},
            {
                $project: {customerInfo: 1, _id: 1}
            }
        ]);
        for (const ele of bulkJSON) {
            console.log("DRN Migration ongoing...");
            if (ele) {
                await DRNRepository.findAndUpdateDoc(
                    {_id: ele._id},
                    {
                        salesCategory: ele?.customerInfo?.customerCategory,
                        categoryType: ele?.customerInfo?.categoryType
                    }
                );
            }
        }
        console.log("DRN Migration SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};
