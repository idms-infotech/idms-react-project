const app = require("express")();
const {
    getAllReports,
    getAllFGINSummaryReports,
    getAllFGINLocationWiseReports,
    getAllFGINAllLocationReports,
    getAllFGINValueFinanceReports,
    getAllFGInventoryReports,
    getAllFGBalanceSummaryReports
} = require("./finishedGoodsInwardEntryReports");

app.get("/getAllReports", getAllReports);
app.get("/getAllFGINSummaryReports", getAllFGINSummaryReports);
app.get("/getAllFGINLocationWiseReports", getAllFGINLocationWiseReports);
app.get("/getAllFGINAllLocationReports", getAllFGINAllLocationReports);
app.get("/getAllFGINValueFinanceReports", getAllFGINValueFinanceReports);
app.get("/getAllFGInventoryReports", getAllFGInventoryReports);
app.get("/getAllFGBalanceSummaryReports", getAllFGBalanceSummaryReports);
module.exports = app;
