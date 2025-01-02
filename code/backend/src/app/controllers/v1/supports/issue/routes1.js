const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {create, getAll, getById, update, getAllMasterDataSupport, getAllReportsSupport} = require("./IssueSupport");
const {getAllMasterData, getAllSubModuleListByMenuId, getAllSubModuleListByMenuIdSupport} = require("./Issue");

app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", update);

app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllMenuItemsListSupport/:company", getAllMasterDataSupport);
app.get("/getAllReports", getAllReportsSupport);
app.get("/getAllSubModuleListByMenuId/:id", validate("checkParamId"), getAllSubModuleListByMenuId);
app.get("/getAllSubModuleListByMenuIdSupport/:id", validate("checkParamId"), getAllSubModuleListByMenuIdSupport);
module.exports = app;
