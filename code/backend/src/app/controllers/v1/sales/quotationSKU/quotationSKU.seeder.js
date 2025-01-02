const {salesCategoryManipulation} = require("../../../../helpers/utility");
const QuotationSKURepository = require("../../../../models/sales/repository/quotationSKURepository");

exports.migrateQuotationOfSKUData = async () => {
    try {
        let bulkJSON = await QuotationSKURepository.filteredQuotationSKUList([
            {
                $project: {
                    _id: 1
                }
            }
        ]);
        for (const ele of bulkJSON) {
            let obj = await QuotationSKURepository.getDocById(ele._id);
            const {categoryType, category} = salesCategoryManipulation(obj.customerCategory);
            obj.customerCategory = category;
            obj.categoryType = categoryType;
            await obj.save();
        }
        console.log("Quotation Of SKU Update SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};
