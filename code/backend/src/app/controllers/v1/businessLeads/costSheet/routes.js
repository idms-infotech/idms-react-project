const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getAllSKUCostEstimateMasterData,
    getAllDSKUCostEstimateMasterData
} = require("./costSheet");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllSKUCostEstimateMasterData", getAllSKUCostEstimateMasterData);
app.get("/getAllDSKUCostEstimateMasterData", getAllDSKUCostEstimateMasterData);
module.exports = app;
