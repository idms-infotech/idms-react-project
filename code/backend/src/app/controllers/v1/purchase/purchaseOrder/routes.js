const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    getPODetailsById,
    update,
    deleteById,
    getAllMasterData,
    getAllItemsForSupplier,
    getAllShortPOForClosing,
    updatePODetailsLineStatusById,
    getSupplierByCategory
} = require("./purchaseOrder");
const RouteReports = require("./routesReports");

app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getSupplierByCategory", getSupplierByCategory);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getPODetailsById/:id", validate("checkParamId"), getPODetailsById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllItemsForSupplier", getAllItemsForSupplier);
app.get("/getAllShortPOForClosing", getAllShortPOForClosing);
app.put("/updatePODetailsLineStatusById/:id", validate("checkParamId"), updatePODetailsLineStatusById);

app.use("/", RouteReports);

module.exports = app;
