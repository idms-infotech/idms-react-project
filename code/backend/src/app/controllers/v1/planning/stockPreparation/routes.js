const app = require("express")();
const {getAll, getAllMasterData, createOrUpdate, checkInventoryRecords} = require("./stockPreparation");

app.get("/getAll", getAll);
app.post("/createOrUpdate", createOrUpdate);
app.get("/getAllMasterData", getAllMasterData);
app.get("/checkInventoryRecords", checkInventoryRecords);

module.exports = app;
