const app = require("express")();
const upload = require("../../../../middleware/upload");
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllMasterData,
    employeeExitReport,
    gradeStructure,
    employeeDepartmentWiseStructure,
    uploadEmployeeFile
} = require("./Employee");

app.post(
    "/create",
    upload.fields([
        {
            name: "empResume",
            maxCount: 1
        },
        {
            name: "empPhoto",
            maxCount: 1
        },
        {
            name: "empAadharCard",
            maxCount: 1
        },
        {
            name: "empPanCard",
            maxCount: 1
        },
        {
            name: "empExpCertificate",
            maxCount: 1
        },
        {
            name: "empRelievingLetter",
            maxCount: 1
        },
        {
            name: "uploadBankPassBook",
            maxCount: 1
        },
        {
            name: "uploadBankCheckBook",
            maxCount: 1
        },
        {
            name: "uploadOfferLetter",
            maxCount: 1
        },
        {
            name: "uploadAppointmentLetter",
            maxCount: 1
        }
    ]),
    create
);
app.get("/getAll", getAll);
app.get("/employeeExitReport", employeeExitReport);
app.get("/gradeStructure", gradeStructure);
app.get("/employeeDepartmentWiseStructure", employeeDepartmentWiseStructure);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put(
    "/update/:id",
    validate("checkParamId"),
    upload.fields([
        {
            name: "empResume",
            maxCount: 1
        },
        {
            name: "empPhoto",
            maxCount: 1
        },
        {
            name: "empAadharCard",
            maxCount: 1
        },
        {
            name: "empPanCard",
            maxCount: 1
        },
        {
            name: "empExpCertificate",
            maxCount: 1
        },
        {
            name: "empRelievingLetter",
            maxCount: 1
        },
        {
            name: "uploadBankPassBook",
            maxCount: 1
        },
        {
            name: "uploadBankCheckBook",
            maxCount: 1
        },
        {
            name: "uploadOfferLetter",
            maxCount: 1
        },
        {
            name: "uploadAppointmentLetter",
            maxCount: 1
        }
    ]),
    update
);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllMasterData", getAllMasterData);

module.exports = app;
