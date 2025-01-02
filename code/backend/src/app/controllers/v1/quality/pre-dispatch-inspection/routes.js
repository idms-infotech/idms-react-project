const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    getPDIRDetailsById,
    update,
    deleteById,
    getAllMasterData,
    getPDIRDetailsBySalesInvoiceId,
    getAllReports,
    getProductSpecificationBySKUId,
    getAllSalesInvoiceForPDIREntry
} = require("./pre-dispatch-inspection");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getPDIRDetailsById/:id", validate("checkParamId"), getPDIRDetailsById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getPDIRDetailsBySalesInvoiceId/:id", validate("checkParamId"), getPDIRDetailsBySalesInvoiceId);
app.get("/getProductSpecificationBySKUId", getProductSpecificationBySKUId);
app.get("/getAllSalesInvoiceForPDIREntry", getAllSalesInvoiceForPDIREntry);
app.get("/getAllReports", getAllReports);
module.exports = app;
