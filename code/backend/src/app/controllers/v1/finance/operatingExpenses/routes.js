const app = require("express")();
const {getAll, update, getAllMasterData} = require("./operatingExpenses");
app.get("/getAll", getAll);
app.post("/update", update);
app.get("/getAllMasterData", getAllMasterData);
module.exports = app;
