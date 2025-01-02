const app = require("express")();
const {createOrUpdate, getAllMasterData, getAll} = require("./screenMakingLog");

app.post("/createOrUpdate", createOrUpdate);
app.get("/getAll", getAll);
app.get("/getAllMasterData", getAllMasterData);

module.exports = app;
