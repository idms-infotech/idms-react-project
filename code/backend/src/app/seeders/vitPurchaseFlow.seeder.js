const {updatePurchaseCostRateInSupplierDetails} = require("../controllers/v1/purchase/items/items");
const {migratePOData} = require("../controllers/v1/purchase/purchaseOrder/purchaseOrder.seeder");
const {migrateMRNData} = require("../controllers/v1/quality/Mrn/Mrn");
const {migrateGINData} = require("../controllers/v1/stores/goodsInwardEntry/goodsInwardEntry");
const {migrateGRNData} = require("../controllers/v1/stores/goodsReceiptNote/goodsReceiptNote");
const {migrateInventoryData} = require("../controllers/v1/stores/Inventory/Inventory");
const SalesUOMUnitMasterRepository = require("../models/settings/repository/SalesUOMUnitMasterRepository");
const UOMUnitMasterRepository = require("../models/settings/repository/UOMUnitMasterRepository");
const {salesUOMUnitMasterInert} = require("./salesUOMUnitMasters.seeder");
const {UOMUnitMasterInert} = require("./UOMUnitMasters.seeder");
const {updateManyUOMUnit} = require("./updateUOM.seeder");

exports.VITPurchaseFlow = async function (companyId) {
    try {
        //  Step 1 First Do Supplier Category (bulkDataMigrateSupplier )And Customer Category update  (bulkUpdateCustomerCategory)

        await UOMUnitMasterRepository.removeAll();
        await SalesUOMUnitMasterRepository.removeAll();
        await UOMUnitMasterInert(companyId);
        await salesUOMUnitMasterInert(companyId);
        await updateManyUOMUnit();
        await updatePurchaseCostRateInSupplierDetails();
        await migratePOData();
        await migrateGRNData();
        await migrateMRNData();
        await migrateGINData();
        await migrateInventoryData();
    } catch (error) {
        throw new Error(error);
    }
};
