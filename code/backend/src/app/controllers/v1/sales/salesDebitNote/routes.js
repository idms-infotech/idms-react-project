const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getAllSalesDebitNoteByCustomerId,
    getAllReports,
    getAllSalesDNDetailsReports,
    getAllSalesDNSummaryReports,
    getDNDetailsById
} = require("./salesDebitNote");

app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getDNDetailsById/:id", validate("checkParamId"), getDNDetailsById);
app.get("/getAllSalesDebitNoteByCustomerId/:id", validate("checkParamId"), getAllSalesDebitNoteByCustomerId);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllReports", getAllReports);
app.get("/getAllSalesDNSummaryReports", getAllSalesDNSummaryReports);
app.get("/getAllSalesDNDetailsReports", getAllSalesDNDetailsReports);

module.exports = app;
