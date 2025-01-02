const router = require("express").Router();
const prospect = require("./prospect/routes");
const NPDRequest = require("./NPDRequest/routes");
const checklistParticulars = require("./checklistParticulars/routes");
const technicalQuestionnaire = require("./technicalQuestionnaire/routes");
const NPDReview = require("./NPDReview/routes");
const sampleRequest = require("./sampleRequest/routes");
const sampleJCCreation = require("./sampleJCCreation/routes");
const sampleJCEntry = require("./sampleJCEntry/routes");
const SKUProcessFlow = require("./SKUProcessFlow/routes");
const directCostDSKU = require("./directCostDSKU/routes");

router.use("/prospect", prospect);
router.use("/NPD", NPDRequest);
router.use("/checklistParticulars", checklistParticulars);
router.use("/technicalQuestionnaire", technicalQuestionnaire);
router.use("/NPDReview", NPDReview);
router.use("/sampleRequest", sampleRequest);
router.use("/sampleJCCreation", sampleJCCreation);
router.use("/sampleJCEntry", sampleJCEntry);
router.use("/SKUProcessFlow", SKUProcessFlow);
router.use("/directCostDSKU", directCostDSKU);

module.exports = router;
