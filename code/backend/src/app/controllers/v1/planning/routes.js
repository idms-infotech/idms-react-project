const router = require("express").Router();

const BOM = require("./billOfMaterial/routes");
const WIPInventory = require("./WIPInventory/routes");
const prodItemMaster = require("./prodItemMaster/routes");
const productMaster = require("./productMaster/routes");
const processResourceManagement = require("./process-resource-management/routes");
const processMaster = require("./processMaster/routes");
const directCost = require("./directCost/routes");
const SKUCostSheet = require("./SKUCostSheet/routes");
const jobCard = require("./jobCard/routes");
const goodsTransferRequest = require("./goodsTransferRequest/routes");
const stockPreparation = require("./stockPreparation/routes");
const BOMOfJobWorkItem = require("./BOMOfJobWorkItem/routes");
const JWPrincipal = require("./JWPrincipal/routes");
const planningItemMaster = require("./planningItemMaster/routes");
const SKUMasterJP15 = require("./SKUMasterJP15/routes");
const logisticsProvider = require("./logisticsProvider/routes");
const productionUnitConfig = require("./productionUnitConfig/routes");
const invZoneConfig = require("./invZoneConfig/routes");
const prodProcessConfig = require("./prodProcessConfig/routes");
const JWIItemStdCost = require("./JWIItemStdCost/routes");
const prodItemStdCosts = require("./prodItemStdCosts/routes");
const prodProcessFlow = require("./prodProcessFlow/routes");
const batchCard = require("./batchCard/routes");
const BOMOfKIT = require("./BOMOfKIT/routes");
const packingStandard = require("./SKUAttributes/packingStandard/routes");

router.use("/billOfMaterial", BOM);
router.use("/WIPInventory", WIPInventory);
router.use("/prodItemMaster", prodItemMaster);
router.use("/productMaster", productMaster);
router.use("/processResourceManagement", processResourceManagement);
router.use("/processMaster", processMaster);
router.use("/directCost", directCost);
router.use("/SKUCostSheet", SKUCostSheet);
router.use("/jobCard", jobCard);
router.use("/goodsTransferRequest", goodsTransferRequest);
router.use("/stockPreparation", stockPreparation);
router.use("/BOMOfJobWorkItem", BOMOfJobWorkItem);
router.use("/JWPrincipal", JWPrincipal);
router.use("/planningItemMaster", planningItemMaster);
router.use("/SKUMasterJP15", SKUMasterJP15);
router.use("/logisticsProvider", logisticsProvider);
router.use("/productionUnitConfig", productionUnitConfig);
router.use("/invZoneConfig", invZoneConfig);
router.use("/prodProcessConfig", prodProcessConfig);
router.use("/JWIItemStdCost", JWIItemStdCost);
router.use("/prodItemStdCosts", prodItemStdCosts);
router.use("/prodProcessFlow", prodProcessFlow);
router.use("/batchCard", batchCard);
router.use("/BOMOfKIT", BOMOfKIT);
router.use("/packingStandard", packingStandard);

module.exports = router;
