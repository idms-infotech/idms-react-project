const app = require("express")();
const {validate} = require("../../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getPackingDetailsBySKUId,
    getAllCopyFlowMasterData,
    createCopy
} = require("./packingStandard");

app.post("/create", create);
app.post("/createCopy", createCopy);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllCopyFlowMasterData", getAllCopyFlowMasterData);
app.get("/getPackingDetailsBySKUId/:id", validate("checkParamId"), getPackingDetailsBySKUId);

module.exports = app;
