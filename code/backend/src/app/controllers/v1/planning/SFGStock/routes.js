const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    deleteById,
    update,
    getAllMasterData,
    getAllReports,
    getStockPreparationByIdAndType,
    getSheetToSheetList
} = require("./SFGStock");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getSheetToSheetList", getSheetToSheetList);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getStockPreparationByIdAndType", getStockPreparationByIdAndType);
app.get("/getAllReports", getAllReports);
module.exports = app;
