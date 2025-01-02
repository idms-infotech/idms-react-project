const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {create, getAllFilterData, update, getAllMasterData} = require("./subModulePermissions");

app.post("/create", create);
app.get("/getAllFilterData", getAllFilterData);
app.put("/update/:id", validate("checkParamId"), update);
app.get("/getAllMasterData", getAllMasterData);
module.exports = app;
