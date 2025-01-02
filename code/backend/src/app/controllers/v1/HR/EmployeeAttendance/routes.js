const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getAllReports,
    uploadEmployeeAttendance
} = require("./EmployeeAttendance");

app.post("/create", create);
app.get("/getAllReports", getAllReports);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData/:date", getAllMasterData);
app.post("/uploadEmployeeAttendance", uploadEmployeeAttendance);

module.exports = app;
