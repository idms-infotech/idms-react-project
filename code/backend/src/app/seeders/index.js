const {subModuleInsert} = require("./subModule.seeder");
const {roleInsert} = require("./role.seeder");
const {menuItemInsert} = require("./menuItem.seeder");
const {appParameterInsert, deleteManyAppParameter} = require("./appParameter.seeder");
const {attributesConfigurationInsert} = require("./attributesConfiguration.seeder");
const {labelMasterInsert} = require("./labelMaster.seeder");
const {purchaseSACInsert} = require("./purchaseSAC.seeder");
const {mailConfigInsert} = require("./mailConfig.seeder");
const {operatingExpensesInsert} = require("./operatingExpenses.seeder");
const {companyInsert, superAdminUserInsert} = require("./superadminUser.seeder");
const {permissionForSuperAdmin} = require("../controllers/v1/settings/subModulePermissions/subModulePermissions");
const {triggers} = require("../middleware/cronJobs");
const {updateBalanceJCCQtyOfSO} = require("../controllers/v1/sales/salesOrder/salesOrder");
const {UOMUnitMasterInert} = require("./UOMUnitMasters.seeder");
const {updateManyUOMUnit} = require("./updateUOM.seeder");
const {salesUOMUnitMasterInert} = require("./salesUOMUnitMasters.seeder");
const {companyTypeWiseInsert} = require("./companyTypeWise.seeder");
const {updatePurchaseCostRateInSupplierDetails} = require("../controllers/v1/purchase/items/items");
const {updateCategoryTypeInCustomerInfo} = require("../controllers/v1/sales/SKU/SKU");
const {updateSupplierCategoryType} = require("../controllers/v1/purchase/suppliers/suppliers");
const {companySupplierInsert} = require("./companySupplier.seeder");
const {VITPurchaseFlow} = require("./vitPurchaseFlow.seeder");
const {VITSalesFlow} = require("./vitSalesFlow.seeder");
const {updateRevisionInfo} = require("./revisionInfo.seeder");
const {transferAppParamToModule} = require("./transferAppParameterToModule");
const {invZoneInsert} = require("./invZone.seeder");
const {reportFormatInsert} = require("./reportFormat.seeder");
const {assetClassInsert} = require("./assetClass.seeder");
const {updateUOMBulk} = require("./setUOM.seeder");
const {removeAllCollectionsExcept} = require("./removeCollections");
const {updateCacheCurrency} = require("../controllers/v1/settings/currencyMaster/currencyMaster");
require("./migration.seeder");
exports.mainDataInsertFn = async () => {
    let companyId = await companyInsert();
    await updateCacheCurrency(companyId);
    // await VITPurchaseFlow(companyId);
    // await VITSalesFlow();
    // await updateUOMBulk();

    await updateRevisionInfo();
    await invZoneInsert(companyId);
    await assetClassInsert(companyId);

    await companySupplierInsert(companyId);

    //  Don't Uncomment Until Backup Taken
    // await removeAllCollectionsExcept();

    triggers();
    await roleInsert(companyId);
    await superAdminUserInsert(companyId);
    await subModuleInsert();
    await menuItemInsert(companyId);
    await appParameterInsert(companyId);
    await attributesConfigurationInsert();
    await labelMasterInsert(companyId);
    await purchaseSACInsert(companyId);
    await mailConfigInsert(companyId);
    await operatingExpensesInsert(companyId);
    await permissionForSuperAdmin(companyId);
    await UOMUnitMasterInert(companyId);
    await salesUOMUnitMasterInert(companyId);
    await transferAppParamToModule(companyId);
    await companyTypeWiseInsert(companyId);
    await deleteManyAppParameter();
    await reportFormatInsert(companyId);
};
