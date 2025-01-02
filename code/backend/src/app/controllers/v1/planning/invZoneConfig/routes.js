const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {create, getAll, getById, update, deleteById, bulkUpdate} = require("./invZoneConfig");

app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.put("/bulkUpdate", bulkUpdate);
app.delete("/delete/:id", validate("checkParamId"), deleteById);

module.exports = app;
