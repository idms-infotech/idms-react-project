const router = require("express").Router();
const travelRequest = require("./travelRequest/routes");
const invoicePayment = require("./invoicePayment/routes");
const purchaseRegisterEntry = require("./purchaseRegisterEntry/routes");

router.use("/travelRequest", travelRequest);
router.use("/invoicePayment", invoicePayment);
router.use("/purchaseRegisterEntry", purchaseRegisterEntry);
module.exports = router;
