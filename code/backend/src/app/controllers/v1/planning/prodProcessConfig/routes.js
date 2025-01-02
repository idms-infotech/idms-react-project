const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    bulkUpdate,
    getAllForMapProcess,
    bulkUpdateProcess
} = require("./prodProcessConfig");

app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getAllForMapProcess", getAllForMapProcess);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.post("/bulkUpdate", bulkUpdate);
app.post("/bulkUpdateProcess", bulkUpdateProcess);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);

module.exports = app;
