const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {CALIBRATION_AND_VERIFICATION: SCHEMA_CONST} = require("../../mocks/schemasConstant/maintenanceConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const calibrationAndVerificationSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Company"
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "User"
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "User"
        },
        equipment: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Asset"
        },
        calibrationDate: {
            type: Date,
            required: false,
            default: new Date()
        },
        calibrationDue: {
            type: Date,
            required: false,
            default: new Date()
        },

        calibrationAgency: {
            type: String,
            required: false
        },
        calibrationResult: {
            type: String,
            required: false,
            enum: ["Passed", "Failed"],
            default: "Passed"
        },
        remarks: {
            type: String,
            required: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
calibrationAndVerificationSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
calibrationAndVerificationSchema.index({calibrationDate: -1});
calibrationAndVerificationSchema.index({calibrationDue: -1});
calibrationAndVerificationSchema.plugin(paginatePlugin);
const CalibrationAndVerification = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, calibrationAndVerificationSchema);

module.exports = CalibrationAndVerification;
const auditTrail = async (master, modifiedPaths, isNew, isModified) => {
    const {createdBy, updatedBy, company} = master;
    const auditTrail = {
        company: company,
        oldData: JSON.stringify(await master.constructor.findById(master._id)),
        data: JSON.stringify(master),
        user: isNew ? createdBy : updatedBy,
        action: isNew ? SCHEMA_CONST.ADDED_ACTION : SCHEMA_CONST.UPDATED_ACTION,
        fieldsModified: modifiedPaths.toString()
    };
    await Audit.auditModule(auditTrail);
};
