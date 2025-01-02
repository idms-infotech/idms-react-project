const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const upload = require("../../../../middleware/upload");
const {create, getAll, getById, update, deleteById, getAllMasterData} = require("./NPDRequest");
app.post(
    "/create",
    upload.fields([
        {
            name: "engineeringDrawing",
            maxCount: 1
        },
        {
            name: "productSpecification",
            maxCount: 1
        },
        {
            name: "designMockUpFile",
            maxCount: 1
        },
        {
            name: "artworkForProcessingFile",
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
            name: "engineeringDrawing",
            maxCount: 1
        },
        {
            name: "productSpecification",
            maxCount: 1
        },
        {
            name: "designMockUpFile",
            maxCount: 1
        },
        {
            name: "artworkForProcessingFile",
            maxCount: 1
        }
    ]),
    update
);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
module.exports = app;
