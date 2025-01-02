const {checkDomesticCustomer, getIncrementNumWithPrefix} = require("../../../../helpers/utility");
const {SALES_CATEGORY} = require("../../../../mocks/constantData");
const {B2B_CUSTOMER} = require("../../../../mocks/schemasConstant/salesConstant");
const CustomerRepository = require("../../../../models/sales/repository/customerRepository");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {
    getAllCustomerCategory,
    setCustomerNextAutoIncrementNo
} = require("../../settings/customerCategory/customerCategory");
const {CustomerJSON, CUST_CATEGORY_JSON} = require("./constantFile");

const bulkUpdateCustomerCategory = async () => {
    try {
        let bulkJSON = CustomerJSON;
        let missingCat = [];
        for (const obj of bulkJSON) {
            let customerObj = await CustomerRepository.findOneDoc(
                {customerCode: obj.customerCode},
                {
                    customerCode: 1,
                    customerCategory: 1,
                    company: 1,
                    _id: 1
                }
            );
            const isDomestic = await checkDomesticCustomer(obj.customerCategory);
            obj.categoryType = isDomestic ? SALES_CATEGORY.DOMESTIC : SALES_CATEGORY.EXPORTS;
            let categoryList = await getAllCustomerCategory(customerObj.company);
            if (categoryList?.length) {
                let category = categoryList.find(x => obj.customerCategory == x.category);
                if (!!category) {
                    obj.customerCode = getIncrementNumWithPrefix({
                        modulePrefix: category.prefix,
                        autoIncrementValue: category.nextAutoIncrement,
                        digit: category.digit
                    });
                } else {
                    missingCat.push(obj.customerCategory);
                }
                await setCustomerNextAutoIncrementNo(obj.customerCategory);
            } else {
                obj.customerCode = await getAndSetAutoIncrementNo(
                    {...B2B_CUSTOMER.AUTO_INCREMENT_DATA()},
                    obj.company,
                    true
                );
            }
            // console.log(obj.customerCode);

            let output = await CustomerRepository.findAndUpdateDoc(
                {_id: customerObj._id},
                {
                    customerCode: obj.customerCode,
                    customerCategory: obj.customerCategory,
                    categoryType: obj.categoryType
                }
            );
            console.log(obj.customerCode, "Updated Customer:", output);
        }
        console.log("missingCat", missingCat);
        console.log("Customer Category Updated SUCCESS");
    } catch (error) {
        console.error("error", error);
    }
};
// bulkUpdateCustomerCategory().then(console.log("CUSTOMER"));
const updateCustomerByCategory = async () => {
    try {
        let missingCat = [];
        let customersList = await CustomerRepository.filteredCustomerList([
            {
                $project: {
                    _id: 1,
                    customerCategory: 1,
                    company: 1,
                    customerCode: 1
                }
            }
        ]);
        const CustomerCatMap = new Map(CUST_CATEGORY_JSON.map(z => [z["Old Category"], z["New Category"]]));
        for await (const ele of customersList) {
            if (!CustomerCatMap.get(ele.customerCategory)) missingCat.push(ele.customerCategory);
            ele.customerCategory = CustomerCatMap.get(ele.customerCategory);
            const isDomestic = await checkDomesticCustomer(ele.customerCategory);
            ele.categoryType = isDomestic ? SALES_CATEGORY.DOMESTIC : SALES_CATEGORY.EXPORTS;
            let categoryList = await getAllCustomerCategory(ele.company);
            if (categoryList?.length) {
                let category = categoryList.find(x => ele.customerCategory == x.category);
                if (!!category) {
                    ele.customerCode = getIncrementNumWithPrefix({
                        modulePrefix: category.prefix,
                        autoIncrementValue: category.nextAutoIncrement,
                        digit: category.digit
                    });
                }
                await setCustomerNextAutoIncrementNo(ele.customerCategory);
            }
            console.log("ele.customerCode", ele.customerCode);
            let output = await CustomerRepository.findAndUpdateDoc(
                {_id: ele._id},
                {
                    customerCode: ele.customerCode,
                    categoryType: ele.categoryType,
                    customerCategory: ele.customerCategory
                }
            );
            // console.log("output", output);
        }
        console.log("missingCat", missingCat);
        console.log("Customer Category Type Updated");
    } catch (error) {
        console.error("error", error);
    }
};
// updateCustomerByCategory().then(console.log("CUSTOMER_CATEGORY"));
