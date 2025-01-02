const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getFGCorrectionBySKUId,
    getAllFGCorrectionHistoryReports
} = require("./FGCorrection");

app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getFGCorrectionBySKUId/:id", validate("checkParamId"), getFGCorrectionBySKUId);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllFGCorrectionHistoryReports", getAllFGCorrectionHistoryReports);

module.exports = app;
