const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    DRNDetailsByCustomerId,
    getAllForCancel,
    getAllDRNSummaryReports,
    getAllReports
} = require("./dispatchRequestNote");

app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getAllForCancel", getAllForCancel);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/DRNDetailsByCustomerId/:id", validate("checkParamId"), DRNDetailsByCustomerId);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllDRNSummaryReports", getAllDRNSummaryReports);
app.get("/getAllReports", getAllReports);
module.exports = app;
