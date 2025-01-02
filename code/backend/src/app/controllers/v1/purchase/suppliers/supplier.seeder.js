const {getIncrementNumWithPrefix, checkDomesticCustomer} = require("../../../../helpers/utility");
const {SALES_CATEGORY} = require("../../../../mocks/constantData");
const ItemRepository = require("../../../../models/purchase/repository/itemRepository");
const SupplierRepository = require("../../../../models/purchase/repository/supplierRepository");
const SupplierCategoryRepository = require("../../../../models/settings/repository/supplierCategoryRepository");
const {
    getAllSupplierCategory,
    setSupplierNextAutoIncrementNo
} = require("../../settings/supplierCategory/supplierCategory");
const {SupplierJSON} = require("./constantFile");

const bulkDataMigrateSupplierFoATP = async () => {
    try {
        let bulkJSON = SupplierJSON;
        let missingArray = [];
        await SupplierRepository.updateManyDoc({supplierName: {$exists: true}}, [
            {
                $set: {
                    supplierName: {$trim: {input: "$supplierName"}}
                }
            }
        ]);
        await SupplierCategoryRepository.updateManyDoc({}, {nextAutoIncrement: 1});
        for (const obj of bulkJSON) {
            let supplierObj = await SupplierRepository.findOneDoc(
                {supplierName: obj.supplierName},
                {supplierPurchaseType: 1, supplierCode: 1, company: 1, _id: 1}
            );
            const isDomestic = await checkDomesticCustomer(obj.supplierCategory);

            if (supplierObj) {
                const categoryList = await SupplierCategoryRepository.filteredSupplierCategoryList([
                    {
                        $project: {__v: 0}
                    }
                ]);
                if (categoryList?.length) {
                    let category = categoryList.find(x => obj.supplierCategory == x.category);
                    console.log("obj.supplierCategory", obj.supplierCategory);
                    console.log("category", category);
                    if (!!category) {
                        supplierObj.supplierPurchaseType = obj.supplierCategory;
                        supplierObj.categoryType = isDomestic ? SALES_CATEGORY.DOMESTIC : SALES_CATEGORY.IMPORTS;
                        supplierObj.supplierCode = getIncrementNumWithPrefix({
                            modulePrefix: category.prefix,
                            autoIncrementValue: category.nextAutoIncrement,
                            digit: category.digit
                        });
                        await ItemRepository.findAndUpdateDoc(
                            {"supplierDetails.supplierId": supplierObj._id},

                            {
                                $set: {
                                    "supplierDetails.$[s].supplierCategory": supplierObj.supplierPurchaseType,
                                    "supplierDetails.$[s].categoryType": supplierObj.categoryType
                                }
                            },
                            {arrayFilters: [{"s.supplierId": supplierObj._id}]}
                        );
                        await setSupplierNextAutoIncrementNo(supplierObj.supplierPurchaseType);
                    }
                }
                console.log("supplierObj", supplierObj);

                let newData = await supplierObj.save();
                console.log("new newData", newData);
            } else {
                missingArray.push(obj);
            }
        }
        console.log("missingArray", missingArray);

        console.log("Supplier Category Migration SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};

// bulkDataMigrateSupplierFoATP().then("----------");
