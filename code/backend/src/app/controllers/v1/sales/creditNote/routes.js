const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getCNDetailsById,
    getAllCreditNoteByCustomerId,
    getAllReports,
    getAllCNDetailsReports,
    getAllCNSummaryReports
} = require("./creditNote");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getCNDetailsById/:id", validate("checkParamId"), getCNDetailsById);
app.get("/getAllCreditNoteByCustomerId/:id", validate("checkParamId"), getAllCreditNoteByCustomerId);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);

app.get("/getAllReports", getAllReports);
app.get("/getAllCNSummaryReports", getAllCNSummaryReports);
app.get("/getAllCNDetailsReports", getAllCNDetailsReports);

module.exports = app;
