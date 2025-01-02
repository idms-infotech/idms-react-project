const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getRMSpecificationByItemId,
    getByMRNIdForRMInspection,
    getMRNDetailsById,
    getMRNDetailsByGRNId
} = require("./Mrn");
const RoutesReports = require("./routesReports");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getMRNDetailsByGRNId/:id", validate("checkParamId"), getMRNDetailsByGRNId);
app.get("/getMRNDetailsById/:id", validate("checkParamId"), getMRNDetailsById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getRMSpecificationByItemId", getRMSpecificationByItemId);
app.get("/getByMRNIdForRMInspection", getByMRNIdForRMInspection);
app.use("/", RoutesReports);

module.exports = app;
