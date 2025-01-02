const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    getAllReports,
    getAllPPVReports,
    getAllPOSummaryReports,
    getAllPOCostAnalysisReports,
    getAllPPVDetailsReports,
    getAllPPVReportsBySupplier,
    getAllPPVSummaryReports,
    getAllOutstandingPOReports,
    getAllPurchaseRateAnalysisByItem,
    getAllItemConsumptionReports
} = require("./purchaseOrderReports");

app.get("/getAllReports", getAllReports);
app.get("/getAllPPVReports", getAllPPVReports);
app.get("/getAllPOSummaryReports", getAllPOSummaryReports);
app.get("/getAllPOCostAnalysisReports", getAllPOCostAnalysisReports);
app.get("/getAllPPVSummaryReports", getAllPPVSummaryReports);
app.get("/getAllPPVReportsBySupplier", getAllPPVReportsBySupplier);
app.get("/getAllPPVDetailsReports", getAllPPVDetailsReports);
app.get("/getAllOutstandingPOReports", getAllOutstandingPOReports);
app.get("/getAllPurchaseRateAnalysisByItem", getAllPurchaseRateAnalysisByItem);
app.get("/getAllItemConsumptionReports", getAllItemConsumptionReports);

module.exports = app;
