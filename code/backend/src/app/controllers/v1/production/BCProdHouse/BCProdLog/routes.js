const app = require("express")();
const {getAll, getAllMasterData, createOrUpdate} = require("./BCProdLog");

app.post("/create", createOrUpdate);
app.get("/getAll", getAll);
app.get("/getAllMasterData", getAllMasterData);

module.exports = app;
