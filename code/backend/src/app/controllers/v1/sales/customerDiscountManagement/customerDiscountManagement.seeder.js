const {salesCategoryManipulation} = require("../../../../helpers/utility");
const CustomerDiscountMgmtRepository = require("../../../../models/sales/repository/customerDiscountManagementRepository");

exports.migrateCustomerDiscountData = async () => {
    try {
        let bulkJSON = await CustomerDiscountMgmtRepository.filteredCustomerDiscountManagementList([
            {
                $project: {_id: 1}
            }
        ]);
        for (const ele of bulkJSON) {
            let obj = await CustomerDiscountMgmtRepository.getDocById(ele._id);
            const {categoryType, category} = salesCategoryManipulation(obj.salesCategory);
            obj.categoryType = categoryType;
            obj.salesCategory = category;
            await obj.save();
        }
        console.log("Customer Discount Mgmt Update SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};
