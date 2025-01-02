const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getChannelsByCategory,
    getAllItemsForChannels,
    getAllReports,
    getPIndentDetailsById
} = require("./purchaseIndent");

app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getPIndentDetailsById/:id", validate("checkParamId"), getPIndentDetailsById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getChannelsByCategory", getChannelsByCategory);
app.get("/getAllItemsForChannels", getAllItemsForChannels);
app.get("/getAllReports", getAllReports);

module.exports = app;
