const ItemRepository = require("../models/purchase/repository/itemRepository");
const SupplierRepository = require("../models/purchase/repository/supplierRepository");
// const ItemPurchaseRateFile1 = require("../../assets/documentFile/1ContinentalItemRate.json");
// const ItemPurchaseRateFile2 = require("../../assets/documentFile/2ContinentalItemRate.json");
// const ItemPurchaseRateFile3 = require("../../assets/documentFile/3ContinentalItemRate.json");
// const ItemPurchaseRateFile4 = require("../../assets/documentFile/4ContinentalItemRate.json");
// const ItemPurchaseRateFile5 = require("../../assets/documentFile/5ContinentalItemRate.json");
// const ItemPurchaseRateFile6 = require("../../assets/documentFile/6ContinentalItemRate.json");
// const ItemPurchaseRateFile7 = require("../../assets/documentFile/7ContinentalItemRate.json");
// const ItemPurchaseRateFile8 = require("../../assets/documentFile/8ContinentalItemRate.json");
exports.updateItemPurchaseRate = async function () {
    try {
        let notFound = [];
        for (const ele of ItemPurchaseRateFile8) {
            let supplierData = await SupplierRepository.findOneDoc(
                {supplierCode: ele["Supplier Code"]},
                {_id: 1, supplierName: 1}
            );
            if (supplierData) {
                await ItemRepository.findAndUpdateDoc(
                    {itemCode: ele["Item Code"], "supplierDetails.supplierId": supplierData._id},
                    {
                        $set: {
                            "supplierDetails.$.uom1": ele["UoM"],
                            "supplierDetails.$.spin": ele["Supplier Part No."],
                            "supplierDetails.$.stdCostUom1": ele["Purchase Cost [Exclusive of GST]"]
                        }
                    },
                    {returnOriginal: true}
                );
            } else {
                notFound.push(`${ele["Item Code"]} & ${ele["Supplier Code"]} does not Exists`);
            }
        }
        console.log("notFound", notFound);
        console.info("Item PurchaseRate Updated successfully!!");
    } catch (error) {
        throw new Error(error);
    }
};
