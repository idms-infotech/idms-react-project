const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {SALARY_MASTER: SCHEMA_CONST} = require("../../mocks/schemasConstant/HRConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const salaryMasterSchema = new mongoose.Schema(
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
        salaryMasterNumber: {
            type: String,
            required: true
        },
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Employee"
        },
        isEmployeeProvidentFund: {
            type: Boolean,
            required: false,
            default: false
        },
        isEmployeeStateInsurance: {
            type: Boolean,
            required: false,
            default: false
        },
        isProfessionalTax: {
            type: Boolean,
            required: false,
            default: false
        },
        isLabourWelfareFund: {
            type: Boolean,
            required: false,
            default: false
        },
        isIncomeTaxTDS: {
            type: Boolean,
            required: false,
            default: false
        },
        PFWagesForContribution: {
            type: String,
            required: false,
            enum: [
                "",
                "Actual Basic",
                "Restricted to 15,000/-",
                "Restricted to 30,000/-",
                "Actual Stipend",
                "Actual Basic + HRA + CCA + PA",
                "Actual Basic + HRA + CCA"
            ],
            default: "Actual Basic"
        },
        salaryComponentDetails: [
            {
                earningHead: {
                    type: String,
                    required: false
                },
                earningType: {
                    type: String,
                    required: false
                },
                factor: {
                    type: String,
                    required: false
                },
                salaryComponentId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "SalaryComponent"
                },
                salaryComponentPerMonth: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false,
                    default: 0
                },
                salaryComponentPerAnnum: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false,
                    default: 0
                }
            }
        ],
        grossSalaryPerMonth: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false,
            default: 0
        },
        grossSalaryPerAnnum: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false,
            default: 0
        },
        employerPFContributionPerMonth: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false,
            default: 0
        },
        employerPFContributionPerAnnum: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false,
            default: 0
        },
        gratuityPerMonth: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false,
            default: 0
        },
        gratuityPerAnnum: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false,
            default: 0
        },
        costTOCompanyCTCPerMonth: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false,
            default: 0
        },
        costTOCompanyCTCPerAnnum: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false,
            default: 0
        },
        effectFromDate: {
            type: Date,
            required: false
        },
        totalDeductionPerMonth: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false,
            default: 0
        },
        financialYear: {
            type: String,
            required: false
        },
        isActive: {
            type: String,
            required: false,
            default: "Yes"
        },
        isOld: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

salaryMasterSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.salaryMasterNumber = await getAndSetAutoIncrementNo(
            SCHEMA_CONST.AUTO_INCREMENT_DATA(),
            this.company,
            true
        );
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);

    next();
});
salaryMasterSchema.plugin(paginatePlugin);
const SalaryMaster = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, salaryMasterSchema);

module.exports = SalaryMaster;
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
