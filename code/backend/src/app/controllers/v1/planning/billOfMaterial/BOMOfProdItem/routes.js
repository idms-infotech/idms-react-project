const app = require("express")();
const {validate} = require("../../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    getBOMDetailsByProdItemId,
    update,
    deleteById,
    getAllMasterData,
    checkBOMOfProdItemExistsById,
    getBOMDetailsForInk,
    getBOMDetailsForMaterialMaster
} = require("./BOMOfProdItem");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getBOMDetailsByProdItemId/:id", validate("checkParamId"), getBOMDetailsByProdItemId);
app.get("/getBOMDetailsForMaterialMaster/:id", validate("checkParamId"), getBOMDetailsForMaterialMaster);
app.get("/checkBOMOfProdItemExistsById/:id", validate("checkParamId"), checkBOMOfProdItemExistsById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getBOMDetailsForInk/:id", validate("checkParamId"), getBOMDetailsForInk);

module.exports = app;
