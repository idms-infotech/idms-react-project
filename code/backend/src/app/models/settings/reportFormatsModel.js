const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {REPORT_FORMATS: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/settingsConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const reportFormatsSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Company"
        },
        menuItemId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "MenuItem"
        },
        menuItemName: {
            type: String,
            required: false
        },
        reportCode: {
            type: String,
            required: false
        },
        reportName: {
            type: String,
            required: false
        },
        reportDesc: {
            type: String,
            required: false
        },
        reportTemplate: {
            type: String,
            required: false
        },
        templateOptions: []
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

reportFormatsSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.reportCode = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
reportFormatsSchema.plugin(paginatePlugin);
const ReportFormats = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, reportFormatsSchema);

module.exports = ReportFormats;
const auditTrail = async (master, modifiedPaths, isNew, isModified) => {
    const {createdBy, updatedBy, company} = master;
    const auditTrail = {
        company: company,
        oldData: JSON.stringify(await master.constructor.findById(master._id)),
        data: JSON.stringify(master),
        user: isNew ? createdBy : updatedBy, // Replace with the actual current user's name
        action: isNew ? SCHEMA_CONSTANT.ADDED_ACTION : SCHEMA_CONSTANT.UPDATED_ACTION,
        fieldsModified: modifiedPaths.toString()
    };
    await Audit.auditModule(auditTrail);
};
