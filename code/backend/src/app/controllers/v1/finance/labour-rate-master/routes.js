const app = require("express")();
const {update, getAllMasterData} = require("./labour-rate-master");
app.post("/update", update);
app.get("/getAllMasterData", getAllMasterData);
module.exports = app;
