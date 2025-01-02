const router = require("express").Router();
//const {rolePermit} = require("../../../middleware/utils");
// const {usersRoles} = require("../../../helpers/global.options").OPTIONS;
const issue = require("./issue/routes1");
const minutesOfMeeting = require("./minutes-of-meeting/routes");
// const customer = require("./customer_user/routes");
// const shop = require("./shop_user/routes");

// const catalogue = require("./catalogue/routes");

router.use("/issue", issue);
router.use("/minutesOfMeeting", minutesOfMeeting);
// router.use("/customer", customer);
// router.use("/shop", shop);
// router.use("/catalogue", rolePermit(usersRoles.SUPER_ADMIN, usersRoles.ADMIN), catalogue);

module.exports = router;
