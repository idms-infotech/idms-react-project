const app = require("express")();
const upload = require("../../../../middleware/upload");
const {validate} = require("../../../../middleware/validators");
const {
    create,
    getAll,
    getById,
    update,
    getCompanyURLs,
    uploadSOSignPDF,
    uploadAndCheckCSVFile,
    bulkInsertByCSVFile
} = require("./company");
app.post(
    "/create",
    upload.fields([
        {
            name: "companyPdfHeaderFile",
            maxCount: 1
        },
        {
            name: "SOPdfHeaderFile",
            maxCount: 1
        },
        {
            name: "registerOfficePOHeaderFile",
            maxCount: 1
        },
        {
            name: "registerOfficeSOHeaderFile",
            maxCount: 1
        },
        {
            name: "factoryPOHeaderFile",
            maxCount: 1
        },
        {
            name: "factorySOHeaderFile",
            maxCount: 1
        },
        {
            name: "companySignatureFile",
            maxCount: 1
        },
        {
            name: "logoFile",
            maxCount: 1
        },
        {
            name: "landingPageHeaderFile",
            maxCount: 1
        },
        {
            name: "welcomeInfoFile",
            maxCount: 1
        },
        {
            name: "SOSignatureFile",
            maxCount: 1
        },
        {
            name: "LUTDocumentFile",
            maxCount: 1
        }
    ]),

    create
);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.get("/getCompanyURLs", getCompanyURLs);
app.put(
    "/update/:id",
    upload.fields([
        {
            name: "companyPdfHeaderFile",
            maxCount: 1
        },
        {
            name: "SOPdfHeaderFile",
            maxCount: 1
        },
        {
            name: "registerOfficePOHeaderFile",
            maxCount: 1
        },
        {
            name: "registerOfficeSOHeaderFile",
            maxCount: 1
        },
        {
            name: "factoryPOHeaderFile",
            maxCount: 1
        },
        {
            name: "factorySOHeaderFile",
            maxCount: 1
        },
        {
            name: "companySignatureFile",
            maxCount: 1
        },
        {
            name: "logoFile",
            maxCount: 1
        },
        {
            name: "landingPageHeaderFile",
            maxCount: 1
        },
        {
            name: "welcomeInfoFile",
            maxCount: 1
        },
        {
            name: "SOSignatureFile",
            maxCount: 1
        },
        {
            name: "LUTDocumentFile",
            maxCount: 1
        }
    ]),
    validate("checkParamId"),
    update
);
app.put(
    "/SOSignPDF/:id",
    upload.fields([
        {
            name: "newSOSignatureFile",
            maxCount: 1
        },
        {
            name: "newSOPdfHeaderFile",
            maxCount: 1
        },
        {
            name: "PISignatureFile",
            maxCount: 1
        },
        {
            name: "DCSignatureFile",
            maxCount: 1
        },
        {
            name: "TISignatureFile",
            maxCount: 1
        }
    ]),
    validate("checkParamId"),
    uploadSOSignPDF
);
app.post("/uploadAndCheckCSVFile", upload.single("uploadFile"), uploadAndCheckCSVFile);
app.post("/bulkInsertByCSVFile", bulkInsertByCSVFile);
// app.delete("/delete/:id", validate("checkParamId"), deleteById);
// app.get("/getAllMasterData", getAllMasterData);

module.exports = app;
