const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {getAll, getById, update, deleteById, getAllMailConfigListForSupport} = require("./mail-config");

app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMailConfigListForSupport", getAllMailConfigListForSupport);

module.exports = app;
