const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {create, getAll, getById, update, deleteById, bulkUpdate, getAllProdUnit} = require("./productionUnitConfig");

app.post("/create", create);
app.put("/bulkUpdate", bulkUpdate);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllProdUnit", getAllProdUnit);

module.exports = app;
