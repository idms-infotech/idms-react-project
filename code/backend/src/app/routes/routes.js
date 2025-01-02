const express = require("express");

const router = express.Router();

const indexRouterV1 = require("./../controllers/v1/index");
// const indexRouterV2 = require('./../controllers/v2/index');

router.use("/v1", indexRouterV1);
// router.use('/v2', indexRouterV2);

module.exports = router;
