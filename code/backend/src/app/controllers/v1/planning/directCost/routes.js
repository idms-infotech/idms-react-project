const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getSKUData,
    checkSKUExistsBySKUId
} = require("./directCost");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/checkSKUExistsBySKUId/:id", validate("checkParamId"), checkSKUExistsBySKUId);
app.get("/getSKUData", getSKUData);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
module.exports = app;
