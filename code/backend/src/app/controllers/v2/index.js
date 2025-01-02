const router = require("express").Router();

// import files
// const adminRouter = require("./admin/routes");
// const sharedRouter = require("./shared/routes");

// const accountsRouter = require("./accounts/routes");
// const supportsRouter = require("./supports/routes");
// const storesRouter = require("./stores/routes");
const settingsRouter = require("./settings/routes");

// const salesRouter = require("./sales/routes");
// const qualityRouter = require("./quality/routes");
// const purchaseRouter = require("./purchase/routes");
// const productionRouter = require("./production/routes");
// const HRRouter = require("./HR/routes");

// use
// router.use("/shared", sharedRouter);
// router.use("/admin", adminRouter);

// router.use("/sales", salesRouter);
// router.use("/purchase", purchaseRouter);
// router.use("/stores", storesRouter);
// router.use("/production", productionRouter);
// router.use("/quality", qualityRouter);
// router.use("/HR", HRRouter);
// router.use("/accounts", accountsRouter);

router.use("/settings", settingsRouter);
// router.use("/supports", supportsRouter);

module.exports = router;
