const app = require("express")();
const {createOrUpdate, getAll, getAllMasterData} = require("./BCInkMixing");

app.post("/create", createOrUpdate);
app.get("/getAll", getAll);
app.get("/getAllMasterData", getAllMasterData);

module.exports = app;
