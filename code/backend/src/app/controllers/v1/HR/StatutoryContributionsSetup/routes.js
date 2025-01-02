const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {getById, deleteById, createOrUpdate, getByCompanyId} = require("./StatutoryContributionsSetup");

app.get("/getById/:id", validate("checkParamId"), getById);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.post("/createOrUpdate", createOrUpdate);
app.get("/getByCompanyId", getByCompanyId);
module.exports = app;
