const app = require("express")();
const {getAll} = require("./FGINTrail");

app.get("/getAll", getAll);

module.exports = app;
