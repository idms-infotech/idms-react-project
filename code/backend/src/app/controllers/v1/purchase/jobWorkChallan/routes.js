const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getAllReports,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getAllJobWorkerItemsOptions,
    getByIdForPDF,
    getAllChallanEwayBillList,
    eWayBillGenerate
} = require("./jobWorkChallan");

app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getAllReports", getAllReports);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getByIdForPDF/:id", validate("checkParamId"), getByIdForPDF);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllJobWorkerItemsOptions", getAllJobWorkerItemsOptions);
app.get("/getAllChallanEwayBillList", getAllChallanEwayBillList);
app.post("/eWayBillGenerate", eWayBillGenerate);

module.exports = app;
