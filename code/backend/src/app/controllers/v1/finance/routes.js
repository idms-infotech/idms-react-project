const router = require("express").Router();

const asset = require("./assetMaster/routes");
const labourRateMaster = require("./labour-rate-master/routes");
const operatingExpenses = require("./operatingExpenses/routes");
const processSpecByProdCategory = require("./processSpecByProdCategory/routes");

router.use("/asset", asset);
router.use("/labourRateMaster", labourRateMaster);
router.use("/operatingExpenses", operatingExpenses);
router.use("/processSpecByProdCategory", processSpecByProdCategory);

module.exports = router;
