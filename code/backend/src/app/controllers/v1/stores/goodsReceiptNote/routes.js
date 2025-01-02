const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const RoutesReport = require("./routesReports");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getAllGRNForSupplementaryPO,
    updateOnCancelGRN,
    getPOBySupplierId,
    getGRNDetailsByPOId,
    getGRNDetailsByCustomerId,
    getAllForCancel
} = require("./goodsReceiptNote");

app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getAllForCancel", getAllForCancel);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getPOBySupplierId/:id", validate("checkParamId"), getPOBySupplierId);
app.get("/getGRNDetailsByPOId/:id", validate("checkParamId"), getGRNDetailsByPOId);
app.get("/getGRNDetailsByCustomerId/:id", validate("checkParamId"), getGRNDetailsByCustomerId);
app.get("/getGRNDetailsById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllGRNForSupplementaryPO", getAllGRNForSupplementaryPO);
app.put("/updateOnCancelGRN/:id", validate("checkParamId"), updateOnCancelGRN);
app.use("/", RoutesReport);

module.exports = app;
