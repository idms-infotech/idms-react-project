const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {LABOUR_RATE: SCHEMA_CONST} = require("../../mocks/schemasConstant/financeConstant");
const labourRateSchema = new mongoose.Schema(
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
        category: {
            type: String,
            required: false
        },
        monthlySalary: {
            type: Number,
            required: false
        },
        daysPerMonth: {
            type: Number,
            required: false
        },
        shiftHrs: {
            type: Number,
            required: false
        },
        salaryPerHour: {
            type: Number,
            set: value => {
                const parsedValue = parseFloat(value);
                if (!isNaN(parsedValue)) {
                    return parsedValue.toFixed(2);
                }
            },
            required: false
        },
        revisionDate: {
            type: Date,
            required: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

labourRateSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

const LabourRateMaster = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, labourRateSchema);

module.exports = LabourRateMaster;
const auditTrail = async (master, modifiedPaths, isNew, isModified) => {
    const {createdBy, updatedBy, company} = master;
    const auditTrail = {
        company: company,
        oldData: JSON.stringify(await master.constructor.findById(master._id)),
        data: JSON.stringify(master),
        user: isNew ? createdBy : updatedBy, // Replace with the actual current user's name
        action: isNew ? SCHEMA_CONST.ADDED_ACTION : SCHEMA_CONST.UPDATED_ACTION,
        fieldsModified: modifiedPaths.toString()
    };
    await Audit.auditModule(auditTrail);
};
