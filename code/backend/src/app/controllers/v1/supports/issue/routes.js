const app = require("express")();
const upload = require("../../../../middleware/upload");
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getAllReports,
    getAllSubModuleListByMenuId,
    getAllSubModuleListByMenuIdSupport
} = require("./Issue");
app.post("/create", upload.single("issueAttachment"), create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getAllSubModuleListByMenuId/:id", validate("checkParamId"), getAllSubModuleListByMenuId);
app.get("/getAllSubModuleListByMenuIdSupport/:id", validate("checkParamId"), getAllSubModuleListByMenuIdSupport);
app.put("/update/:id", validate("checkParamId"), upload.single("issueAttachment"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllReports", getAllReports);

module.exports = app;
