const app = require("express")();
const {
    hrDashboard,
    salesDashboard,
    purchaseDashboard,
    qualityDashboard,
    businessLeadsDashboard,
    storesDashboard,
    getMastersDashboardDataForEmployeeId,
    productionDashboard,
    dispatchDashboard,
    maintenanceDashboard,
    settingDashboard,
    supportDashboard,
    planningDashboard,
    accountsDashboard,
    apiStats
} = require("./dashboard");

app.get("/hr", hrDashboard);
app.get("/sales", salesDashboard);
app.get("/purchase", purchaseDashboard);
app.get("/production", productionDashboard);
app.get("/getMastersDashboardDataForEmployeeId/:employeeId", getMastersDashboardDataForEmployeeId);
app.get("/stores", storesDashboard);
app.get("/maintenance", maintenanceDashboard);
app.get("/quality", qualityDashboard);
app.get("/businessLeads", businessLeadsDashboard);
app.get("/dispatch", dispatchDashboard);
app.get("/setting", settingDashboard);
app.get("/planning", planningDashboard);
app.get("/accounts", accountsDashboard);
app.get("/support", supportDashboard);
app.get("/stats", apiStats);
module.exports = app;
