const app = require("express")();
const {validate} = require("../../../../middleware/validators.js");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getAllCustomersForQuotationSKUByCategory,
    getAllSKUForQuotationSKUByCustomerId,
    getByIdForPDF,
    getAllReports
} = require("./quotationSKU.js");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getAllCustomersForQuotationSKUByCategory", getAllCustomersForQuotationSKUByCategory);
app.get("/getAllSKUForQuotationSKUByCustomerId", getAllSKUForQuotationSKUByCustomerId);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getByIdForPDF/:id", validate("checkParamId"), getByIdForPDF);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllReports", getAllReports);

module.exports = app;
