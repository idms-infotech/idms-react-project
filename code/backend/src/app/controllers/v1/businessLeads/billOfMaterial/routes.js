const router = require("express").Router();

const BoMOfDSKU = require("./BoMOfDSKU/routes");

router.use("/BOMOfSKU", BoMOfDSKU);

module.exports = router;
