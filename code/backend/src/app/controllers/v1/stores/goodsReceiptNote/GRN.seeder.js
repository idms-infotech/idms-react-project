const GRNRepository = require("../../../../models/stores/repository/GRNRepository");

const bulkMigrateGRN = async () => {
    try {
        const toUpdateGRNList = await GRNRepository.filteredGRNList([
            {
                $match: {"GRNDetails.QCLevels": {$exists: false}}
            },
            {
                $lookup: {
                    from: "Items",
                    localField: "GRNDetails.item",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, QCLevels: 1}}],
                    as: "itemInfo"
                }
            },
            {
                $unwind: "$itemInfo"
            },
            {
                $project: {
                    _id: 1,
                    item: "$itemInfo._id",
                    QCLevels: "$itemInfo.QCLevels"
                }
            }
        ]);
        console.log("toUpdateGRNList", toUpdateGRNList, toUpdateGRNList.length);

        for await (const ele of toUpdateGRNList) {
            await GRNRepository.findAndUpdateDoc(
                {_id: ele?._id},
                [
                    {
                        $set: {
                            GRNDetails: {
                                $map: {
                                    input: "$GRNDetails",
                                    as: "elem",
                                    in: {
                                        $mergeObjects: [
                                            "$$elem",
                                            {
                                                QCLevels: ele.QCLevels,
                                                invoiceRate: "$$elem.purchaseRate"
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                ],
                {
                    arrayFilters: [{"elem.item": ele.item}]
                }
            );
        }
        console.log("GRN Migration completed");
    } catch (error) {
        console.error("error", error);
    }
};

// bulkMigrateGRN().then(console.log("GRN"));
