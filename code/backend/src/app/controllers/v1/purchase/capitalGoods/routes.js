const app = require("express")();
const upload = require("../../../../middleware/upload");
const {validate} = require("../../../../middleware/validators");
const {create, getAll, getById, update, deleteById, getAllMasterData} = require("./capitalGoods");

app.post("/create", upload.single("technicalSheetFile"), create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), upload.single("technicalSheetFile"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);

module.exports = app;
