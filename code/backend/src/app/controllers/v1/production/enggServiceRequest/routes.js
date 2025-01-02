const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    maintenanceBreakDownMasterData,
    getAllForMainBD,
    getAllReports
} = require("./enggServiceRequest");

app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getAllForMainBD", getAllForMainBD);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/maintenanceBreakDownMasterData", maintenanceBreakDownMasterData);
app.get("/getAllReports", getAllReports);

module.exports = app;
