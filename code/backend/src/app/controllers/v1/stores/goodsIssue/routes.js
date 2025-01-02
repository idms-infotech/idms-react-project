const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    updateOnResolveDiscrepancy,
    deleteById,
    getAllMasterData,
    getGoodRequisitionById,
    getAllReports
} = require("./goodsIssue.js");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.put("/updateOnResolveDiscrepancy/:id", validate("checkParamId"), updateOnResolveDiscrepancy);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getGoodRequisitionById/:id", validate("checkParamId"), getGoodRequisitionById);
app.get("/getAllReports", getAllReports);

module.exports = app;
