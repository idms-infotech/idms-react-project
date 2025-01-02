const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {OPERATING_EXPENSES: SCHEMA_CONST} = require("../../mocks/schemasConstant/financeConstant");
const operatingExpensesSchema = new mongoose.Schema(
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
        year: {
            type: Number,
            required: true,
            unique: true
        },
        operatingCostDetails: {
            rent: {
                type: Number,
                required: false,
                default: 0
            },
            indirectSalaries: {
                type: Number,
                required: false,
                default: 0
            },
            insurance: {
                type: Number,
                required: false,
                default: 0
            },
            maintenance: {
                type: Number,
                required: false,
                default: 0
            },
            consumables: {
                type: Number,
                required: false,
                default: 0
            },
            electricity: {
                type: Number,
                required: false,
                default: 0
            },
            utility: {
                type: Number,
                required: false,
                default: 0
            },
            marketing: {
                type: Number,
                required: false,
                default: 0
            },
            salesAndDistribution: {
                type: Number,
                required: false,
                default: 0
            },
            adminAndOthers: {
                type: Number,
                required: false,
                default: 0
            }
        },
        totalOperatingCost: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(4);
                }
            },
            required: false,
            default: 0
        },
        totalUnitsProduced: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(4);
                }
            },
            required: false,
            default: 0
        },
        percentageAllocation: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                    return parseFloat(value).toFixed(4);
                }
            },
            required: false,
            default: 0
        },
        opexCostPerUnit: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                    return parseFloat(value).toFixed(4);
                }
            },
            required: false,
            default: 0
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

operatingExpensesSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

const OperatingExpenses = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, operatingExpensesSchema);

module.exports = OperatingExpenses;

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
