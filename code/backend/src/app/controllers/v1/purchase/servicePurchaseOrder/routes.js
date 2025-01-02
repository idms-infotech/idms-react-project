const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getAllReports,
    getSPOSupplierByCategory
} = require("./servicePurchaseOrder");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getSPODetailsById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllReports", getAllReports);
app.get("/getSPOSupplierByCategory", getSPOSupplierByCategory);

module.exports = app;
