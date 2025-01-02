const router = require("express").Router();

const PDIREntry = require("./pre-dispatch-inspection/routes");
const Mrn = require("./Mrn/routes");
const specificationMaster = require("./specificationMaster/routes");
const rmSpecification = require("./rm-specification/routes");
const productSpecification = require("./product-specification/routes");
const productCategorySpecification = require("./productCategorySpecifications/routes");
const itemCategorySpecification = require("./itemCategorySpecifications/routes");
const materialRevalidation = require("./materialRevalidation/routes");

router.use("/PDIREntry", PDIREntry);
router.use("/mrn", Mrn);
router.use("/specificationMaster", specificationMaster);
router.use("/rm-specification", rmSpecification);
router.use("/product-specification", productSpecification);
router.use("/productCategorySpecification", productCategorySpecification);
router.use("/itemCategorySpecification", itemCategorySpecification);
router.use("/materialRevalidation", materialRevalidation);

module.exports = router;
