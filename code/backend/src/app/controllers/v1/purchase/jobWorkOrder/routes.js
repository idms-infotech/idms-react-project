const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getJWItemsByJobWorker,
    getByIdForPDF,
    getAllReports
} = require("./jobWorkOrder");

app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getByIdForPDF/:id", validate("checkParamId"), getByIdForPDF);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getJWItemsByJobWorker/:id", validate("checkParamId"), getJWItemsByJobWorker);
app.get("/getAllReports", getAllReports);
module.exports = app;
