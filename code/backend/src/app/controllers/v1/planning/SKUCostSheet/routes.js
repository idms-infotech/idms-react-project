const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getSKUCostSheetDetailsBySKUId,
    getSKUInCostSheet,
    getByIdForPdf
} = require("./SKUCostSheet");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getByIdForPdf/:id", validate("checkParamId"), getByIdForPdf);
app.get("/getSKUCostSheetDetailsBySKUId/:id", validate("checkParamId"), getSKUCostSheetDetailsBySKUId);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getSKUInCostSheet", getSKUInCostSheet);
module.exports = app;
