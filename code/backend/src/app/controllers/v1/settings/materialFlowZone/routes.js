const app = require("express")();
const {createOrUpdate, getAll, bulkUpdate} = require("./materialFlowZone");

app.post("/createOrUpdate", createOrUpdate);
app.put("/bulkUpdate", bulkUpdate);
app.get("/getAll", getAll);

module.exports = app;
