const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    getAllMasterData,
    getAppParameterValueByCode,
    getAppParameterValueByCodeSupport,
    locationCreate,
    deleteByAppCode
} = require("./appParameter");

app.post("/create", create);
app.post("/locationCreate", locationCreate);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getAppParameterValueByCode/:code", getAppParameterValueByCode);
app.get("/getAppParameterValueByCodeSupport/:company", getAppParameterValueByCodeSupport);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/deleteByAppCode/:code", deleteByAppCode);
app.get("/getAllMasterData", getAllMasterData);

module.exports = app;
