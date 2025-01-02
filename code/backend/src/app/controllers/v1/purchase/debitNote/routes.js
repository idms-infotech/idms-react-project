const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getAllDebitNoteBySupplierId,
    getAllReports,
    getAllDNSummaryReports,
    getDNDetailsById
} = require("./debitNote");

app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getDNDetailsById/:id", validate("checkParamId"), getDNDetailsById);
app.get("/getAllDebitNoteBySupplierId/:id", validate("checkParamId"), getAllDebitNoteBySupplierId);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllReports", getAllReports);
app.get("/getAllDNSummaryReports", getAllDNSummaryReports);

module.exports = app;
