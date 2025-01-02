const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getAllReports,
    approvedODApplicationOfEmployees
} = require("./OnDutyApplication");

app.post("/create", create);
app.get("/getAll", getAll);
app.get("/approvedODApplicationOfEmployees", approvedODApplicationOfEmployees);
app.get("/getAllReports", getAllReports);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
module.exports = app;
