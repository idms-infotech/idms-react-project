const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {create, getAll, update, deleteById, getAllMasterData} = require("./prodItemStdCosts");

app.post("/create", create);
app.get("/getAll", getAll);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);

module.exports = app;
