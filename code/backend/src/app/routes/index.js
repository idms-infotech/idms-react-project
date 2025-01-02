const router = require("express").Router();

const ApiRouter = require("./routes");

/* GET home page. */
// router.get("/", function(req, res) {
// 	res.render("index", { title: "Express" });
// });

router.use("/api", ApiRouter);

module.exports = router;
