const app = require("express").Router();
const {getAllItemWiseReports, getAllRawMaterialInspectionReports, getAllMRNReports, getAllMRNDetailsReports} = require("./MrnReports");
app.get("/getAllMRNReports", getAllMRNReports);
app.get("/getAllItemWiseReports", getAllItemWiseReports);
app.get("/getAllMRNDetailsReports", getAllMRNDetailsReports);
app.get("/getAllRawMaterialInspectionReports", getAllRawMaterialInspectionReports);

module.exports = app;
