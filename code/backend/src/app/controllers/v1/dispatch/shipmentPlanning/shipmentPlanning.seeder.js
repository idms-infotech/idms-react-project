const ShipmentPlanningRepository = require("../../../../models/dispatch/repository/shipmentPlanningRepository");

exports.migrateShipmentData = async () => {
    try {
        let bulkJSON = await ShipmentPlanningRepository.filteredShipmentPlanningList([
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
        for (const obj of bulkJSON) {
            console.log("Shipment Migration ongoing...");
            if (obj) {
                await ShipmentPlanningRepository.findAndUpdateDoc(
                    {_id: obj._id},
                    {
                        customerCategory: obj?.customerInfo?.customerCategory,
                        categoryType: obj?.customerInfo?.categoryType
                    }
                );
            }
        }
        console.log("Shipment Migration SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};
