const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const {
    create,
    login,
    getAll,
    getById,
    update,
    deleteById,
    resetPassword,
    setPassword,
    forgetPassword,
    getAllMasterData,
    getAllReports
} = require("./user");

app.post("/register", create);
app.post("/login", login);
app.get("/getAll", getAll);
app.get("/reports", getAllReports);

app.get("/profile/:id", validate("checkParamId"), getById);
app.put("/update/:id", validate("checkParamId"), update);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);
app.post("/reset-password", resetPassword);
app.post("/set-password", setPassword);
app.post("/forgot-password", forgetPassword);
module.exports = app;
