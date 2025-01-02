const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getDSKUData,
    checkSKUExistsByDSKUId
} = require("./directCostDSKU");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getDSKUData", getDSKUData);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/checkSKUExistsByDSKUId/:id", validate("checkParamId"), checkSKUExistsByDSKUId);
app.get("/getAllMasterData", getAllMasterData);
module.exports = app;
