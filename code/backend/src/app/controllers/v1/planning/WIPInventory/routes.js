const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {getAllReports} = require("./WIPInventory");

app.get("/getAllReports", getAllReports);
module.exports = app;
