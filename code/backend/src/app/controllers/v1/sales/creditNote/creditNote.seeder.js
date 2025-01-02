const {salesCategoryManipulation} = require("../../../../helpers/utility");
const CreditNoteRepository = require("../../../../models/sales/repository/creditNoteRepository");

exports.migrateCNData = async () => {
    try {
        let bulkJSON = await CreditNoteRepository.filteredCreditNoteList([
            {
                $project: {_id: 1}
            }
        ]);
        for (const obj of bulkJSON) {
            let CNObj = await CreditNoteRepository.getDocById(obj._id);
            const {categoryType, category} = salesCategoryManipulation(CNObj.salesCategory);
            CNObj.categoryType = categoryType;
            CNObj.salesCategory = category;
            await CNObj.save();
        }
        console.log("CN Update SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};
