const PurchaseOrderRepository = require("../../../../models/purchase/repository/purchaseOrderRepository");

exports.migratePOData = async () => {
    try {
        let bulkJSON = await PurchaseOrderRepository.filteredPurchaseOrderList([
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [{$project: {supplierPurchaseType: 1, categoryType: 1}}],
                    as: "supplierInfo"
                }
            },
            {$unwind: "$supplierInfo"},
            {
                $project: {supplierInfo: 1, _id: 1}
            }
        ]);
        for (const obj of bulkJSON) {
            console.log("PO Migration ongoing...");
            await PurchaseOrderRepository.findAndUpdateDoc(
                {_id: obj._id},
                {referenceModel: "Supplier", categoryType: obj?.supplierInfo?.categoryType}
            );
        }
        console.log("PO Migration SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};
