const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {OPTIONS} = require("../../helpers/global.options");
const {SALARY_COMPONENTS: SCHEMA_CONST} = require("../../mocks/schemasConstant/HRConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const salaryComponentSchema = new mongoose.Schema(
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
        componentCode: {
            type: String,
            required: false
        },
        earningHead: {
            type: String,
            required: false
        },
        abbreviation: {
            type: String,
            required: false
        },
        earningType: {
            type: String,
            required: false,
            enum: ["Fixed Amount", "Variable Amount", "Percentage Of Basic", "Percentage Of CTC"]
        },
        earningCycle: {
            type: String,
            required: false,
            enum: ["Every Month", "During any payroll"]
        },
        status: {
            type: String,
            required: false,
            enum: OPTIONS.defaultStatus.getCommonStatusAsArray()
        },
        componentType: {
            type: String,
            required: false
        },
        componentName: {
            type: String,
            required: false
        },
        isCalculateOnProRataBasis: {
            type: Boolean,
            required: false
        },
        isPartOfCTC: {
            type: Boolean,
            required: false
        },
        isManagementStaffSalary: {
            type: Boolean,
            required: false
        },
        isOperatingStaffSalary: {
            type: Boolean,
            required: false
        },
        calculationFactor: {
            type: String,
            required: false
        },
        calculationFactorAgainstType: {
            type: String,
            required: false
        },
        componentGuideline: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        priority: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        isActive: {
            type: String,
            required: false,
            default: "Yes"
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

salaryComponentSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;

    if (this.isNew) {
        this.componentCode = await getAndSetAutoIncrementNo(SCHEMA_CONST.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
salaryComponentSchema.plugin(paginatePlugin);
const SalaryComponent = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, salaryComponentSchema);

module.exports = SalaryComponent;
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
