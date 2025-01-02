const {default: mongoose} = require("mongoose");
const ModelArray = [
    "BOMOfJobWorkItem",
    // "InvZoneConfig",
    // "ProdProcessConfig",
    // "ProductionUnitConfig",
    "BOMOfProdItem",
    // "BOMOfSFGMaster",
    "HSN",
    "SAC",
    "SaleHSN",
    "SaleSAC",
    "JobWorkItemMaster"
];
exports.updateRevisionInfo = async function () {
    try {
        const updatePromises = ModelArray.map(async model => {
            const collection = mongoose.connection.collection(model);

            const documents = await collection
                .aggregate([
                    {
                        $match: {revisionInfo: {$exists: false}}
                    },
                    {
                        $lookup: {
                            from: "User",
                            localField: "createdBy",
                            foreignField: "_id",
                            pipeline: [{$project: {name: 1, _id: 0}}],
                            as: "user"
                        }
                    },
                    {
                        $unwind: {
                            path: "$user",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $addFields: {"user.name": {$ifNull: ["$user.name", ""]}}
                    },
                    {
                        $project: {
                            company: 0,
                            createdBy: 0,
                            updatedBy: 0
                        }
                    }
                ])
                .toArray();
            const updateOps = documents.map(doc => ({
                updateOne: {
                    filter: {_id: doc._id},
                    update: {
                        $set: {
                            revisionInfo: {
                                revisionNo: 0,
                                revisionDate: doc.createdAt,
                                reasonForRevision: "-",
                                revisionProposedBy: "-",
                                revisionApprovedBy: doc.user.name
                            },
                            revisionHistory: [
                                {
                                    ...doc,
                                    revisionInfo: {
                                        revisionNo: 0,
                                        revisionDate: doc.createdAt,
                                        reasonForRevision: "-",
                                        revisionProposedBy: "-",
                                        revisionApprovedBy: doc.user.name
                                    }
                                }
                            ]
                        }
                    }
                }
            }));

            if (updateOps.length > 0) {
                await collection.bulkWrite(updateOps);
            }
        });

        await Promise.all(updatePromises);

        console.info("Revision Info Updated successfully!!");
    } catch (error) {
        console.error("Error updating revision info:", error);
        throw new Error(error);
    }
};
