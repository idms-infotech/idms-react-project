const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const upload = require("../../../../middleware/upload");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getAllPendingDSKUConversionReport,
    getAllDSKUToSKUConversionReport,
    getAllNPDMasterByDSKUId
} = require("./NPDMasters");
app.post(
    "/create",
    upload.fields([
        {
            name: "drawingArtWorkFile",
            maxCount: 1
        },
        {
            name: "productionLayoutFile",
            maxCount: 1
        }
    ]),
    create
);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getAllNPDMasterByDSKUId/:id", validate("checkParamId"), getAllNPDMasterByDSKUId);
app.put(
    "/update/:id",
    validate("checkParamId"),
    upload.fields([
        {
            name: "drawingArtWorkFile",
            maxCount: 1
        },
        {
            name: "productionLayoutFile",
            maxCount: 1
        }
    ]),
    update
);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllPendingDSKUConversionReport", getAllPendingDSKUConversionReport);
app.get("/getAllDSKUToSKUConversionReport", getAllDSKUToSKUConversionReport);
module.exports = app;
