const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {getAll, getById, update} = require("./attributesConfiguration");

app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
module.exports = app;
