const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getAllItemsByLocationAndDept,
    getAllBOMItemsForGTR,
    getAllGtRequestFulfillmentReports
} = require("./goodsTransferRequest");

app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllItemsByLocationAndDept", getAllItemsByLocationAndDept);
app.get("/getAllBOMItemsForGTR", getAllBOMItemsForGTR);
app.get("/getAllGtRequestFulfillmentReports", getAllGtRequestFulfillmentReports);

module.exports = app;
