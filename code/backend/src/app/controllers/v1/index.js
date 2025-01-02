const router = require("express").Router();

const accountsRouter = require("./accounts/routes");
const storesRouter = require("./stores/routes");
const settingsRouter = require("./settings/routes");
const hrRouter = require("././HR/routes");
const supportsRouter = require("././supports/routes");
const salesRouter = require("./sales/routes");
const qualityRouter = require("./quality/routes");
const purchaseRouter = require("./purchase/routes");
const productionRouter = require("./production/routes");
const dashboardRouter = require("./dashboard/routes");
const dispatchRouter = require("./dispatch/routes");
const businessLeadsRouter = require("./businessLeads/routes");
const maintenanceRouter = require("./maintenance/routes");
const planning = require("./planning/routes");
const financeRouter = require("./finance/routes");

router.use("/sales", salesRouter);
router.use("/planning", planning);
router.use("/stores", storesRouter);
router.use("/production", productionRouter);
router.use("/quality", qualityRouter);
router.use("/accounts", accountsRouter);
router.use("/settings", settingsRouter);
router.use("/supports", supportsRouter);
router.use("/hr", hrRouter);
router.use("/purchase", purchaseRouter);
router.use("/dashboard", dashboardRouter);
router.use("/dispatch", dispatchRouter);
router.use("/businessLeads", businessLeadsRouter);
router.use("/maintenance", maintenanceRouter);
router.use("/finance", financeRouter);

module.exports = router;
