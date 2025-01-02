const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const upload = require("../../../../middleware/upload");
const {create, getAll, getById, update, deleteById, getAllMasterData, getAllReports} = require("./travelRequest");

app.post(
    "/create",
    upload.fields([
        {
            name: "supportingDocumentsFile",
            maxCount: 1
        }
    ]),
    create
);

app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put(
    "/update/:id",
    validate("checkParamId"),
    upload.fields([
        {
            name: "supportingDocumentsFile",
            maxCount: 1
        }
    ]),
    update
);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllReports", getAllReports);
module.exports = app;
