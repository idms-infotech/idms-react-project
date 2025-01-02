const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {ON_DUTY_APPLICATION: SCHEMA_CONST} = require("../../mocks/schemasConstant/HRConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const onDutyApplicationSchema = new mongoose.Schema(
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
        onDutyApplicationNumber: {
            type: String,
            required: true
        },
        ODType: {
            type: String,
            required: false
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
        halfDay: {
            type: String,
            required: false
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
        ODDays: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        monthDays: [
            {
                date: {
                    type: Date,
                    required: false
                },
                ODDays: {
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
        reason: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: ["Submitted", "Recommend", "Approved", "Cancelled"],
            default: "Submitted"
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

onDutyApplicationSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.onDutyApplicationNumber = await getAndSetAutoIncrementNo(
            SCHEMA_CONST.AUTO_INCREMENT_DATA(),
            this.company,
            true
        );
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
onDutyApplicationSchema.plugin(paginatePlugin);
const OnDutyApplication = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, onDutyApplicationSchema);

module.exports = OnDutyApplication;
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
