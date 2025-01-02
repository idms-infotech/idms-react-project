const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {getAll, update} = require("./mailTrigger");

app.get("/getAll", getAll);
app.put("/update/:id", validate("checkParamId"), update);

module.exports = app;
