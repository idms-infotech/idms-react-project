const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getBySKUId,
    getAllCopyFlowMasterData,
    createCopy
} = require("./SKUProcessFlow");

app.post("/create", create);
app.post("/createCopy", createCopy);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getBySKUId/:id", validate("checkParamId"), getBySKUId);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllCopyFlowMasterData", getAllCopyFlowMasterData);

module.exports = app;
