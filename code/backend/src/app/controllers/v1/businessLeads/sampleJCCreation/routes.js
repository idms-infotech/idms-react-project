const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getCustomersByCategory,
    getSampleJCDetailsByCustomerId,
    getBOMBySKUId,
    getByIdForPDF,
    getAllReports
} = require("./sampleJCCreation");

app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getByIdForPDF/:id", validate("checkParamId"), getByIdForPDF);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getCustomersByCategory", getCustomersByCategory);
app.get("/getSampleJCDetailsByCustomerId", getSampleJCDetailsByCustomerId);
app.get("/getBOMBySKUId", getBOMBySKUId);
app.get("/getAllReports", getAllReports);

module.exports = app;
