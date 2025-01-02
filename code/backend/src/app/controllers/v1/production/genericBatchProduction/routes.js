const app = require("express")();
const {getAll, createOrUpdate, getAllMasterData} = require("./genericBatchProduction");

app.post("/createOrUpdate", createOrUpdate);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAll", getAll);

module.exports = app;
