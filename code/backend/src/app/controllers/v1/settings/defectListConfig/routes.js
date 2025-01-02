const app = require("express")();
const {createOrUpdate, getAll} = require("./defectListConfig");

app.post("/createOrUpdate", createOrUpdate);
app.get("/getAll", getAll);

module.exports = app;
