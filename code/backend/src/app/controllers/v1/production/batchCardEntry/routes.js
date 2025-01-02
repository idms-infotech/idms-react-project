const app = require("express")();
const {createOrUpdate, getAll, getAllMasterData, getProcessListByChildItemId} = require("./batchCardEntry");

app.post("/createOrUpdate", createOrUpdate);
app.get("/getAll", getAll);
app.get("/getProcessListByChildItemId", getProcessListByChildItemId);
app.get("/getAllMasterData", getAllMasterData);

module.exports = app;
