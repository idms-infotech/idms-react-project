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
    getAllReports,
    getAllCustomersWithAddress,
    getCustomersList
} = require("./customerMaster");
app.post("/create", create);
app.get("/getAll", getAll);
app.get("/getCustomersList", getCustomersList);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getAllReports", getAllReports);
app.get("/getAllCustomersWithAddress", getAllCustomersWithAddress);
module.exports = app;
