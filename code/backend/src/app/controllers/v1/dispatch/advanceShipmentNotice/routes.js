const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    sendMailById,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getANSDetailsById,
    ASNDetailsBySalesInvoiceId,
    getAllReports
} = require("./advanceShipmentNotice");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/sendMailById/:id", validate("checkParamId"), sendMailById);
app.get("/getANSDetailsById/:id", validate("checkParamId"), getANSDetailsById);
app.get("/ASNDetailsBySalesInvoiceId/:id", validate("checkParamId"), ASNDetailsBySalesInvoiceId);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllReports", getAllReports);

module.exports = app;
