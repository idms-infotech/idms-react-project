const app = require("express")();
const {createOrUpdate, getAll, getAllMasterData} = require("./weeding");

app.post("/createOrUpdate", createOrUpdate);
app.get("/getAll", getAll);
app.get("/getAllMasterData", getAllMasterData);

module.exports = app;
