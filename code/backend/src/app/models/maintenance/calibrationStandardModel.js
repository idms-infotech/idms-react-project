const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {CALIBRATION_STANDARD: SCHEMA_CONST} = require("../../mocks/schemasConstant/maintenanceConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const {OPTIONS} = require("../../helpers/global.options");
const calibrationStandardSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
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
        standardCode: {
            type: String,
            required: false
        },
        standardName: {
            type: String,
            required: false
        },
        standardType: {
            type: String,
            required: false
        },
        measurementRange: {
            type: String,
            required: false
        },
        calibrationMethod: {
            type: String,
            required: false
        },
        calibrationInterval: {
            type: String,
            required: false
        },
        traceability: {
            type: String,
            required: false
        },
        lastCalibrationDate: {
            type: Date,
            required: false,
            default: new Date()
        },
        calibrationAgency: {
            type: String,
            required: false
        },
        standardLocation: {
            type: String,
            required: false
        },
        calibrationCost: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: OPTIONS.defaultStatus.getAllCalibrationStandardStatusArray(),
            default: OPTIONS.defaultStatus.ACTIVE
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

calibrationStandardSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.standardCode = await getAndSetAutoIncrementNo({...SCHEMA_CONST.AUTO_INCREMENT_DATA()}, this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
calibrationStandardSchema.index({status: -1});
calibrationStandardSchema.plugin(paginatePlugin);
const CalibrationStandard = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, calibrationStandardSchema);

module.exports = CalibrationStandard;
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
