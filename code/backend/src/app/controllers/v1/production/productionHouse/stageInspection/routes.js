const app = require("express")();
const {getAll, getAllMasterData, createOrUpdate} = require("./stageInspection");

app.post("/createOrUpdate", createOrUpdate);
app.get("/getAll", getAll);
app.get("/getAllMasterData", getAllMasterData);

module.exports = app;
