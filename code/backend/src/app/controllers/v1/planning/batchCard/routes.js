const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getJCOptions,
    getBOMOfSKUItems,
    getBatchInfo,
    getAllBCInkSummary
} = require("./batchCard");

app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getJCOptions", getJCOptions);
app.get("/getBOMOfSKUItems", getBOMOfSKUItems);
app.get("/getBatchInfo", getBatchInfo);
app.get("/getAllBCInkSummary", getAllBCInkSummary);

module.exports = app;
