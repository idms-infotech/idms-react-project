const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getSIDetailsById,
    getAllReports,
    getAllServiceEInvoiceList,
    eInvoiceGenerate
} = require("./serviceInvoice");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getSIDetailsById/:id", validate("checkParamId"), getSIDetailsById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllReports", getAllReports);
app.get("/getAllServiceEInvoiceList", getAllServiceEInvoiceList);
app.post("/eInvoiceGenerate", eInvoiceGenerate);

module.exports = app;