const {salesCategoryManipulation} = require("../../../../helpers/utility");
const SalesForecastRepository = require("../../../../models/sales/repository/salesForecastRepository");

exports.migrateQuotationOfSKUData = async () => {
    try {
        let bulkJSON = await SalesForecastRepository.filteredSalesForecastList([
            {
                $project: {
                    _id: 1
                }
            }
        ]);
        for (const ele of bulkJSON) {
            let obj = await SalesForecastRepository.getDocById(ele._id);
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
