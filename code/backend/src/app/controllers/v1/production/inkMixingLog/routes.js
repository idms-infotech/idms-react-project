const app = require("express")();
const {getAll, getAllMasterData, createOrUpdate} = require("./inkMixingLog");

app.post("/createOrUpdate", createOrUpdate);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAll", getAll);

module.exports = app;
