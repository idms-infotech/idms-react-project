const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const RouteReports = require("./routesReports");
const {
    create,
    getAll,
    getById,
    update,
    bulkCreate,
    deleteById,
    getAllMasterData,
    getAllFGINMasterData,
    getSKUListByCustomerId,
    getSKUListForReco,
    bulkUpdate
} = require("./finishedGoodsInwardEntry");

app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.put("/bulkUpdate", bulkUpdate);
app.post("/bulkCreate", bulkCreate);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllFGINMasterData", getAllFGINMasterData);
app.get("/getSKUListByCustomerId", getSKUListByCustomerId);
app.get("/getSKUListForReco", getSKUListForReco);
app.use("/", RouteReports);
module.exports = app;
