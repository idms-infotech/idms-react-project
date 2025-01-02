const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {ADVANCE_SALARY_REQUEST: SCHEMA_CONST} = require("../../mocks/schemasConstant/HRConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const advanceSalaryRequestSchema = new mongoose.Schema(
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
        salaryAdvanceRequestNumber: {
            type: String,
            required: true
        },
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Employee"
        },
        employeeCode: {
            type: String,
            required: true
        },
        requestDate: {
            type: Date,
            required: true
        },
        amount: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        repayStartMonthYear: {
            type: Date,
            required: true
        },
        repayEndMonthYear: {
            type: Date,
            required: true
        },
        tenureMonths: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        repayAmountPerMonth: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: true
        },
        reasonForAdvance: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: ["Submitted", "Approved", "Rejected"],
            default: "Submitted"
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

advanceSalaryRequestSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;

    if (this.isNew) {
        this.salaryAdvanceRequestNumber = await getAndSetAutoIncrementNo(
            SCHEMA_CONST.AUTO_INCREMENT_DATA(),
            this.company,
            true
        );
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
advanceSalaryRequestSchema.plugin(paginatePlugin);
const AdvanceSalaryRequest = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, advanceSalaryRequestSchema);

module.exports = AdvanceSalaryRequest;
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
