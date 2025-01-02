const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getAllSourceDoc,
    getSourceItemsByDocId
} = require("./goodsInwardEntry");
const RoutesReports = require("./routesReports");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllSourceDoc", getAllSourceDoc);
app.get("/getSourceItemsByDocId", getSourceItemsByDocId);
app.use("/", RoutesReports);
module.exports = app;
