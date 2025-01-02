const {salesCategoryManipulation} = require("../../../../helpers/utility");
const SIRepository = require("../../../../models/sales/repository/serviceInvoiceRepository");
exports.migrateServiceInvoiceData = async () => {
    try {
        let bulkJSON = await SIRepository.filteredServiceInvoiceList([
            {
                $project: {_id: 1}
            }
        ]);
        for (const ele of bulkJSON) {
            let obj = await SIRepository.getDocById(ele._id);
            const {categoryType, category} = salesCategoryManipulation(obj.customerCategory);
            obj.customerCategory = category;
            obj.categoryType = categoryType;
            await obj.save();
        }
        console.log("Service Inv Update SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};
