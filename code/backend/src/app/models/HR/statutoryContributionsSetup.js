const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {STATUTORY_CONTRIBUTION: SCHEMA_CONST} = require("../../mocks/schemasConstant/HRConstant");

const statutoryContributionsSetupSchema = new mongoose.Schema(
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
        employeeProvidentFund: {
            establishmentId: {
                type: String,
                required: false
            },
            labourIdentificationNo: {
                type: String,
                required: false
            },
            deductionCycle: {
                type: String,
                required: false,
                enum: ["Monthly", "Half-yearly", "Yearly"],
                default: "Monthly"
            },
            employeeContributionRate: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            employeeContributionRateToEPS: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            employeeContributionRateToEPF: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            includeEmployerContributionInCTC: {
                type: Boolean,
                required: false,
                default: false
            },
            restrictContributionToRs1500OfPFWage: {
                type: Boolean,
                required: false,
                default: false
            },
            proRateBasedCalculationLOP: {
                type: Boolean,
                required: false,
                default: false
            }
        },
        employeeStateInsurance: {
            employerESINo: {
                type: String,
                required: false
            },
            deductionCycle: {
                type: String,
                required: false,
                enum: ["Monthly", "Half-yearly", "Yearly"],
                default: "Monthly"
            },
            employeeContributionRate: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            employerContributionRate: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            includeEmployerContributionInCTC: {
                type: Boolean,
                required: false,
                default: false
            },
            proRateBasedCalculationLOP: {
                type: Boolean,
                required: false,
                default: false
            }
        },
        professionalTax: {
            statePlaceOfWork: {
                type: String,
                required: false
            },
            employerPTNo: {
                type: String,
                required: false
            },
            deductionCycle: {
                type: String,
                required: false,
                enum: ["Monthly", "Half-yearly", "Yearly"],
                default: "Monthly"
            }
        },
        labourWelfareFund: {
            statePlaceOfWork: {
                type: String,
                required: false
            },
            registrationNo: {
                type: String,
                required: false
            },
            deductionCycle: {
                type: String,
                required: false,
                enum: ["Monthly", "Half-yearly", "Yearly"],
                default: "Monthly"
            },
            employeeContribution: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            employerContribution: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            contributionMonths: {
                type: String,
                required: false
            }
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

statutoryContributionsSetupSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;

    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

const StatutoryContributionsSetup = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, statutoryContributionsSetupSchema);

module.exports = StatutoryContributionsSetup;
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
