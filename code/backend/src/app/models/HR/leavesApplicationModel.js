const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {LEAVES_APPLICATION: SCHEMA_CONST} = require("../../mocks/schemasConstant/HRConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const leavesApplicationSchema = new mongoose.Schema(
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
        leavesApplicationNumber: {
            type: String,
            required: true
        },
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Employee"
        },
        applicationDate: {
            type: Date,
            required: true
        },
        leaveType: {
            type: String,
            required: true
        },
        fromDate: {
            type: Date,
            required: true
        },
        fromSession: {
            type: String,
            required: false,
            default: ""
        },
        toDate: {
            type: Date,
            required: true
        },
        toSession: {
            type: String,
            required: false,
            default: ""
        },
        leaveDays: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        monthLeaves: [
            {
                date: {
                    type: Date,
                    required: true
                },
                leaveDays: {
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
        resumptionDate: {
            type: Date,
            required: true
        },
        reasonForLeave: {
            type: String,
            required: false
        },
        cancelReason: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: ["Submitted", "Recommend", "Availed", "Approved", "Cancelled", "Rejected", "Deleted", "Adjusted"],
            default: "Submitted"
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

leavesApplicationSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;

    if (this.isNew) {
        this.leavesApplicationNumber = await getAndSetAutoIncrementNo(
            SCHEMA_CONST.AUTO_INCREMENT_DATA(),
            this.company,
            true
        );
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
leavesApplicationSchema.plugin(paginatePlugin);
leavesApplicationSchema.index({employeeId: 1});
const LeavesApplication = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, leavesApplicationSchema);

module.exports = LeavesApplication;
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
