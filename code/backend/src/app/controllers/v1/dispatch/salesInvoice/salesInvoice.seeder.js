const SalesInvoiceRepository = require("../../../../models/dispatch/repository/salesInvoiceRepository");

exports.migrateInvoiceData = async () => {
    try {
        let bulkJSON = await SalesInvoiceRepository.getFilterSalesInvoiceList([
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
            console.log("Invoice Migration ongoing...");
            if (obj) {
                await SalesInvoiceRepository.findAndUpdateDoc(
                    {_id: obj._id},
                    {
                        customerCategory: obj?.customerInfo.customerCategory,
                        categoryType: obj?.customerInfo.categoryType
                    }
                );
            }
        }
        console.log("Invoice Migration SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};
