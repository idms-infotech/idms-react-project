const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    viewByBOMId,
    getProdItemsListForStockLevels,
    getProdItemsByLocation,
    getAllForHSN,
    getAllCopyFlowMasterData,
    createCopy
} = require("./prodItemMaster");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getProdItemsByLocation", getProdItemsByLocation);
app.get("/viewByBOMId", viewByBOMId);
app.get("/getProdItemsListForStockLevels", getProdItemsListForStockLevels);
app.get("/getAllForHSN", getAllForHSN);
app.get("/getAllCopyFlowMasterData", getAllCopyFlowMasterData);
app.post("/createCopy", createCopy);

module.exports = app;
