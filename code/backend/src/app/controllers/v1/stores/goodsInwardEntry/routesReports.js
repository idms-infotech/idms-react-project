const app = require("express")();
const {getAllReports} = require("./goodsInwardEntryReports");

app.get("/getAllReports", getAllReports);

module.exports = app;
