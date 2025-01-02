const app = require("express")();
const {getAll, createOrUpdate, getAllMapProcessNames, bulkUpdate} = require("./processListConfig");

app.post("/createOrUpdate", createOrUpdate);
app.put("/bulkUpdate", bulkUpdate);
app.get("/getAll", getAll);
app.get("/getAllMapProcessNames", getAllMapProcessNames);

module.exports = app;
