const router = require("express").Router();
// const {rolePermit} = require("../../../middleware/utils");
// const {usersRoles} = require("../../../helpers/global.options").OPTIONS;

const GoodsReceiptNote = require("./goodsReceiptNote/routes");
const GoodsInwardEntry = require("./goodsInwardEntry/routes");
const Inventory = require("./Inventory/routes");
const FGIN = require("./finishedGoodsInwardEntry/routes");
const goodsTransferResponse = require("./goodsTransferResponse/routes");
const FGINTrail = require("./FGINTrail/routes");
const FGINForSFG = require("./FGINForSFG/routes");

router.use("/gin", GoodsInwardEntry);
router.use("/grn", GoodsReceiptNote);
router.use("/inventory", Inventory);
router.use("/FGIN", FGIN);
router.use("/goodsTransferResponse", goodsTransferResponse);
router.use("/FGINTrail", FGINTrail);
router.use("/FGINForSFG", FGINForSFG);

module.exports = router;
