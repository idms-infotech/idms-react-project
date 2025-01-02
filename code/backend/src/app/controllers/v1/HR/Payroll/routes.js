const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getAllReports,
    // getAllSalarySlipReports,
    // getByIdForSlip
} = require("./Payroll");

app.post("/create", create);
app.get("/getAllReports", getAllReports);
app.get("/getById/:id", validate("checkParamId"), getById);
// app.get("/getByIdForSlip/:id", validate("checkParamId"), getByIdForSlip);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData/:date", getAllMasterData);
// app.get("/getAllSalarySlipReports", getAllSalarySlipReports);
module.exports = app;
