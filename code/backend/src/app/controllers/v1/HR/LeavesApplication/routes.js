const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getPaidLeaveByEmpId,
    getAllReports,
    approvedLeaveApplicationOfEmployees,
    updateOnLeaveAdjustment,
    updateOnCancel
} = require("./LeavesApplication");

app.post("/create", create);
app.get("/getAll", getAll);
app.get("/approvedLeaveApplicationOfEmployees", approvedLeaveApplicationOfEmployees);
app.get("/getAllReports", getAllReports);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getPaidLeaveByEmpId/:id", validate("checkParamId"), getPaidLeaveByEmpId);
app.put("/update/:id", validate("checkParamId"), update);
app.put("/updateOnCancel/:id", validate("checkParamId"), updateOnCancel);
app.put("/updateOnLeaveAdjustment/:id", validate("checkParamId"), updateOnLeaveAdjustment);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
module.exports = app;
