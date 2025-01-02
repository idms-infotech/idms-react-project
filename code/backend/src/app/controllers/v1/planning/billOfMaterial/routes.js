const router = require("express").Router();

const BOMOfProdItem = require("./BOMOfProdItem/routes");
const BoMOfSKU = require("./BoMOfSKU/routes");
const BoMOfProduct = require("./BoMOfProduct/routes");
const BoMJP15 = require("./BoMJP15/routes");

router.use("/BOMOfProdItem", BOMOfProdItem);
router.use("/BoMOfSKU", BoMOfSKU);
router.use("/BoMOfProduct", BoMOfProduct);
router.use("/BoMJP15", BoMJP15);

module.exports = router;
