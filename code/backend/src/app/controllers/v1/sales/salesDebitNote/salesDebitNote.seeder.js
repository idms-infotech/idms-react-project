const {salesCategoryManipulation} = require("../../../../helpers/utility");
const SalesDebitNoteRepository = require("../../../../models/sales/repository/salesDebitNoteRepository");

exports.migrateSalesDNData = async () => {
    try {
        let bulkJSON = await SalesDebitNoteRepository.filteredSalesDebitNoteList([
            {
                $project: {
                    _id: 1
                }
            }
        ]);
        for (const ele of bulkJSON) {
            let obj = await SalesDebitNoteRepository.getDocById(ele._id);
            const {categoryType, category} = salesCategoryManipulation(obj.salesCategory);
            obj.salesCategory = category;
            obj.categoryType = categoryType;
            await obj.save();
        }
        console.log("Sales DN Update SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};
