const PIRepository = require("../../../../models/sales/repository/proformaInvoiceRepository");

exports.migratePIData = async () => {
    try {
        let bulkJSON = await PIRepository.filteredProformaInvoiceList([
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
        // console.log("bulkJSON", bulkJSON, bulkJSON.length);
        // for (const ele of bulkJSON) {
        //     console.log("PI Migration ongoing...");
        //     if (ele) {
        //         await PIRepository.findAndUpdateDoc(
        //             {_id: ele._id},
        //             {
        //                 salesCategory: ele?.customerInfo?.customerCategory,
        //                 categoryType: ele?.customerInfo?.categoryType
        //             }
        //         );
        //     }
        // }
        console.log("PI Migration SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};
