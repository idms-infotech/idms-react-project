const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getAllJWItemForStockLevels,
    getAllForHSN,
    createCopy,
    getAllCopyMasterData
} = require("./jobWorkItemMaster");

app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllJWItemForStockLevels", getAllJWItemForStockLevels);
app.get("/getAllForHSN", getAllForHSN);
app.get("/getAllCopyMasterData", getAllCopyMasterData);
app.post("/createCopy", createCopy);

module.exports = app;
