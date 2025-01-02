const {migrateInvoiceData} = require("../controllers/v1/dispatch/salesInvoice/salesInvoice.seeder");
const {migrateShipmentData} = require("../controllers/v1/dispatch/shipmentPlanning/shipmentPlanning.seeder");
const {migrateDRNData} = require("../controllers/v1/sales/dispatchRequestNote/dispatchRequestNote.seeder");
const {migratePIData} = require("../controllers/v1/sales/proformaInvoice/proformaInvoice.seeder.");
const {migrateSOData} = require("../controllers/v1/sales/salesOrder/salesOrder.seeder");
const {updateSellingRateInCustomerInfo} = require("../controllers/v1/sales/SKU/SKU.seeder");

exports.VITSalesFlow = async function () {
    try {
        // Check this time that Customer Category And category type saved correctly or Not

        // await updateSellingRateInCustomerInfo();
        // await migrateSOData();
        // await migratePIData();
        // await migrateDRNData();
        // await migrateShipmentData();
        // await migrateInvoiceData();
    } catch (error) {
        throw new Error(error);
    }
};
