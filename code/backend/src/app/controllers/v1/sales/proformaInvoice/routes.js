const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    getAllReports,
    getProInvDetailsById,
    getCustomerByCategory,
    getSKUListByCustomer
} = require("./proformaInvoice");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getProInvDetailsById/:id", validate("checkParamId"), getProInvDetailsById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllReports", getAllReports);
app.get("/getCustomerByCategory", getCustomerByCategory);
app.get("/getSKUListByCustomer", getSKUListByCustomer);
module.exports = app;
