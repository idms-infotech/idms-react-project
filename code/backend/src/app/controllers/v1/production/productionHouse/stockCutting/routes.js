const app = require("express")();
const {createOrUpdate, getAll, getAllMasterData, getInventoryItemsOnSelect} = require("./stockCutting");

app.post("/createOrUpdate", createOrUpdate);
app.get("/getAll", getAll);
app.get("/getInventoryItemsOnSelect", getInventoryItemsOnSelect);
app.get("/getAllMasterData", getAllMasterData);

module.exports = app;
