const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {getAll, getById, getAllApiStack} = require("./audit");

app.get("/getAll", getAll);
app.get("/getAllApiStack", getAllApiStack);
app.get("/getById/:id", validate("checkParamId"), getById);
module.exports = app;
