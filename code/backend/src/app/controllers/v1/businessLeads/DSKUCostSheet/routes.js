const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getDSKUCostSheetDetailsByDSKUId,
    getDSKUInCostSheet,
    getAllReports,
    getByIdForPdf
} = require("./DSKUCostSheet");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getByIdForPdf/:id", validate("checkParamId"), getByIdForPdf);
app.get("/getDSKUCostSheetDetailsByDSKUId/:id", validate("checkParamId"), getDSKUCostSheetDetailsByDSKUId);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getDSKUInCostSheet", getDSKUInCostSheet);
app.get("/getAllReports", getAllReports);
module.exports = app;
