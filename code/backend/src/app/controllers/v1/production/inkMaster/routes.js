const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {create, getAll, getById, update, deleteById, getAllMasterData} = require("./inkMaster");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);

module.exports = app;
