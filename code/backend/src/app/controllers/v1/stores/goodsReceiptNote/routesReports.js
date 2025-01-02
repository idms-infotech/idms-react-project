const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    getGRNDiscrepancyReports,
    getMonthlySupplierEvaluation,
    getMonthlyEvaluationBySupplierId,
    getAllItemWiseReports,
    getAllGRNLocationWiseReports,
    getAllGRNReports
} = require("./goodsReceiptNoteReports");

app.get("/getAllGRNReports", getAllGRNReports);
app.get("/getAllItemWiseReports", getAllItemWiseReports);
app.get("/getGRNDiscrepancyReports", getGRNDiscrepancyReports);
app.get("/getMonthlySupplierEvaluation", getMonthlySupplierEvaluation);
app.get("/getMonthlyEvaluationBySupplierId/:id", validate("checkParamId"), getMonthlyEvaluationBySupplierId);
app.get("/getAllGRNLocationWiseReports", getAllGRNLocationWiseReports);

module.exports = app;
