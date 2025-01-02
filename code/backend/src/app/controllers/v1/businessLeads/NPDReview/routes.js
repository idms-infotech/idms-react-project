const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getAllNPDFinalStatusReport,
    getAllNPDStatusReport
} = require("./NPDReview");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getAllNPDFinalStatusReport", getAllNPDFinalStatusReport);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllNPDStatusReport", getAllNPDStatusReport);

module.exports = app;
