const accountsLabelsJson = require("../mocks/labelsMaster/accounts-labels.json");
const businessLeadsLabelsJson = require("../mocks/labelsMaster/business-leads-labels.json");
const dispatchLabelsJson = require("../mocks/labelsMaster/dispatch-labels.json");
const financeLabelsJson = require("../mocks/labelsMaster/finance-labels.json");
const hrLabelsJson = require("../mocks/labelsMaster/hr-labels.json");
const maintenanceLabelsJson = require("../mocks/labelsMaster/maintenance-labels.json");
const planningLabelsJson = require("../mocks/labelsMaster/planning-labels.json");
const productionLabelsJson = require("../mocks/labelsMaster/production-labels.json");
const purchaseLabelsJson = require("../mocks/labelsMaster/purchase-label.json");
const qualityLabelsJson = require("../mocks/labelsMaster/quality-labels.json");
const salesLabelsJson = require("../mocks/labelsMaster/sales-labels.json");
const settingsLabelsJson = require("../mocks/labelsMaster/settings-labels.json");
const storesLabelsJson = require("../mocks/labelsMaster/stores-labels.json");

module.exports = [
    ...accountsLabelsJson,
    ...businessLeadsLabelsJson,
    ...dispatchLabelsJson,
    ...financeLabelsJson,
    ...hrLabelsJson,
    ...maintenanceLabelsJson,
    ...planningLabelsJson,
    ...productionLabelsJson,
    ...purchaseLabelsJson,
    ...qualityLabelsJson,
    ...salesLabelsJson,
    ...settingsLabelsJson,
    ...storesLabelsJson
];
