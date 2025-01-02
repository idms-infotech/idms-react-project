const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    // getAllCancelSalesOrder,
    getSOConfirmationById,
    getAllShortSOForClosing,
    updateSODetailsLineStatusById,
    getAllSalesSKUList,
    getAllSalesSKUListOnOpenPO
} = require("./salesOrder");
const {
    getBackSalesOrderBySKU,
    getBackSalesOrderBySO,
    getAllSOConfirmationReports,
    getAllSOCostAnalysisReports,
    getAllSalesTrendAnalysisReports,
    getAllPurchaseVsInvoiceReports,
    getAllSalesOrderReports,
    getAllSalesOrderStatusReports,
    getSOLineWise
} = require("./salesOrderReports");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getSOConfirmationById/:id", validate("checkParamId"), getSOConfirmationById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllShortSOForClosing", getAllShortSOForClosing);
app.put("/updateSODetailsLineStatusById/:id", validate("checkParamId"), updateSODetailsLineStatusById);
app.get("/getAllSalesSKUList", getAllSalesSKUList);
app.get("/getAllSalesSKUListOnOpenPO", getAllSalesSKUListOnOpenPO);

// app.get("/getAllCancelSalesOrder", getAllCancelSalesOrder);
app.get("/getBackSalesOrderBySKU", getBackSalesOrderBySKU);
app.get("/getBackSalesOrderBySO", getBackSalesOrderBySO);
app.get("/getAllSOConfirmationReports", getAllSOConfirmationReports);
app.get("/getAllSOCostAnalysisReports", getAllSOCostAnalysisReports);
app.get("/getAllSalesTrendAnalysisReports", getAllSalesTrendAnalysisReports);
app.get("/getAllPurchaseVsInvoiceReports", getAllPurchaseVsInvoiceReports);
app.get("/getAllSalesOrderReports", getAllSalesOrderReports);
app.get("/getAllSalesOrderStatusReports", getAllSalesOrderStatusReports);
app.get("/getSOLineWise", getSOLineWise);
module.exports = app;
