const {salesCategoryManipulation} = require("../../../../helpers/utility");
const DirectTaxInvoiceRepository = require("../../../../models/sales/repository/directTaxInvoiceRepository");

exports.migrateDirectTaxData = async () => {
    try {
        let bulkJSON = await DirectTaxInvoiceRepository.filteredDirectTaxInvoiceList([
            {
                $project: {_id: 1}
            }
        ]);
        for (const ele of bulkJSON) {
            let obj = await DirectTaxInvoiceRepository.getDocById(ele._id);
            const {categoryType, category} = salesCategoryManipulation(obj.customerCategory);
            obj.categoryType = categoryType;
            obj.customerCategory = category;
            await obj.save();
        }
        console.log("Direct Tax Update SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};
