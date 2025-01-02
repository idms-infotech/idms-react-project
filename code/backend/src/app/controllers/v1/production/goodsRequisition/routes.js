const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {create, getAll, getById, update, deleteById, getAllMasterData, getAllFilterData} = require("./goodsRequisition");
const {getAllGRSummaryReports, getAllGRFulfillmentReports} = require("./goodsRequisitionReports");

app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllFilterData", getAllFilterData);

app.get("/getAllGRSummaryReports", getAllGRSummaryReports);
app.get("/getAllGRFulfillmentReports", getAllGRFulfillmentReports);

module.exports = app;
