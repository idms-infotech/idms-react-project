const app = require("express")();
const {validate} = require("../../../../middleware/validators.js");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getAllProspectsForQuotationDSKUByCategory,
    getAllDSKUForQuotationDSKUByCustomerId,
    getByIdForPDF,
    getAllReports
} = require("./quotationDSKU.js");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getAllProspectsForQuotationDSKUByCategory", getAllProspectsForQuotationDSKUByCategory);
app.get("/getAllDSKUForQuotationDSKUByCustomerId", getAllDSKUForQuotationDSKUByCustomerId);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getByIdForPDF/:id", validate("checkParamId"), getByIdForPDF);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllReports", getAllReports);

module.exports = app;
