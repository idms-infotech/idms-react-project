const SORepository = require("../../../../models/sales/repository/salesOrderRepository");

exports.migrateSOData = async () => {
    try {
        let bulkJSON = await SORepository.filteredSalesOrderList([
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
            console.log("SO Migration ongoing...");
            let SOObj = await SORepository.getDocById(obj._id);
            let SPVSum = 0;
            SOObj.SODetails = SOObj.SODetails.map(x => {
                x.lineSPV = (+x.netRate - +x.standardRate) * +x.orderedQty;
                SPVSum += x.lineSPV;
                x.salesRate = +x.standardRate;
                return x;
            });
            SOObj.categoryType = obj?.customerInfo?.categoryType;
            SOObj.salesCategory = obj?.customerInfo?.customerCategory;
            SOObj.totalSPV = SPVSum;
            await SOObj.save();
        }
        console.log("SO Migration SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};
