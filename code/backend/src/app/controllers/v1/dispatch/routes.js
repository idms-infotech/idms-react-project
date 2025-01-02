const router = require("express").Router();

const shipmentPlanning = require("./shipmentPlanning/routes");
const salesInvoice = require("./salesInvoice/routes");
const advanceShipmentNotice = require("./advanceShipmentNotice/routes");

router.use("/shipment", shipmentPlanning);
router.use("/salesInvoice", salesInvoice);
router.use("/advanceShipmentNotice", advanceShipmentNotice);

module.exports = router;
