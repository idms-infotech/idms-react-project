const hrMaster = require("../mocks/subModule/hr/masters.json");
const hrTransactions = require("../mocks/subModule/hr/transactions.json");
const hrReports = require("../mocks/subModule/hr/reports.json");

const accountsMaster = require("../mocks/subModule/accounts/masters.json");
const accountsTransactions = require("../mocks/subModule/accounts/transactions.json");
const accountsReports = require("../mocks/subModule/accounts/reports.json");

const businessLeadsMaster = require("../mocks/subModule/businessLeads/masters.json");
const businessLeadsTransactions = require("../mocks/subModule/businessLeads/transactions.json");
const businessLeadsReports = require("../mocks/subModule/businessLeads/reports.json");

const dispatchMaster = require("../mocks/subModule/dispatch/masters.json");
const dispatchTransactions = require("../mocks/subModule/dispatch/transactions.json");
const dispatchReports = require("../mocks/subModule/dispatch/reports.json");

const financeMaster = require("../mocks/subModule/finance/masters.json");
const financeTransactions = require("../mocks/subModule/finance/transactions.json");
const financeReports = require("../mocks/subModule/finance/reports.json");

const maintenanceMaster = require("../mocks/subModule/maintenance/masters.json");
const maintenanceTransactions = require("../mocks/subModule/maintenance/transactions.json");
const maintenanceReports = require("../mocks/subModule/maintenance/reports.json");

const planningMaster = require("../mocks/subModule/planning/masters.json");
const planningTransactions = require("../mocks/subModule/planning/transactions.json");
const planningReports = require("../mocks/subModule/planning/reports.json");

const productionMaster = require("../mocks/subModule/production/masters.json");
const productionTransactions = require("../mocks/subModule/production/transactions.json");
const productionReports = require("../mocks/subModule/production/reports.json");

const purchaseMaster = require("../mocks/subModule/purchase/masters.json");
const purchaseTransactions = require("../mocks/subModule/purchase/transactions.json");
const purchaseReports = require("../mocks/subModule/purchase/reports.json");

const qualityMaster = require("../mocks/subModule/quality/masters.json");
const qualityTransactions = require("../mocks/subModule/quality/transactions.json");
const qualityReports = require("../mocks/subModule/quality/reports.json");

const salesMaster = require("../mocks/subModule/sales/masters.json");
const salesTransactions = require("../mocks/subModule/sales/transactions.json");
const salesReports = require("../mocks/subModule/sales/reports.json");

const settingsMaster = require("../mocks/subModule/settings/masters.json");
const settingsTransactions = require("../mocks/subModule/settings/transactions.json");
const settingsReports = require("../mocks/subModule/settings/reports.json");

const storesMaster = require("../mocks/subModule/stores/masters.json");
const storesTransactions = require("../mocks/subModule/stores/transactions.json");
const storesReports = require("../mocks/subModule/stores/reports.json");

const poweredByIDMSReports = require("../mocks/subModule/poweredByIDMS/reports.json");
const poweredByIDMSTransaction = require("../mocks/subModule/poweredByIDMS/transactions.json");

module.exports = [
    ...hrMaster,
    ...hrTransactions,
    ...hrReports,
    ...accountsMaster,
    ...accountsTransactions,
    ...accountsReports,
    ...businessLeadsMaster,
    ...businessLeadsTransactions,
    ...businessLeadsReports,
    ...dispatchMaster,
    ...dispatchTransactions,
    ...dispatchReports,
    ...financeMaster,
    ...financeTransactions,
    ...financeReports,
    ...maintenanceMaster,
    ...maintenanceTransactions,
    ...maintenanceReports,
    ...planningMaster,
    ...planningTransactions,
    ...planningReports,
    ...productionMaster,
    ...productionTransactions,
    ...productionReports,
    ...purchaseMaster,
    ...purchaseTransactions,
    ...purchaseReports,
    ...qualityMaster,
    ...qualityTransactions,
    ...qualityReports,
    ...salesMaster,
    ...salesTransactions,
    ...salesReports,
    ...settingsMaster,
    ...settingsTransactions,
    ...settingsReports,
    ...storesMaster,
    ...storesTransactions,
    ...storesReports,

    ...poweredByIDMSReports,
    ...poweredByIDMSTransaction
];
