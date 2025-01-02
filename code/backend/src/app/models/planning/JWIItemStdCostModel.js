const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {JWI_ITEM_STD_COST: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/planningConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const JWIItemStdCostSchema = new mongoose.Schema(
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
        jobWorkItem: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "JobWorkItemMaster"
        },
        costSheetNo: {
            type: String,
            required: false
        },
        jobWorkerDetails: [
            {
                jobWorkItemCode: {
                    type: String,
                    required: false
                },
                jobWorker: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "Supplier"
                },
                jobWorkerName: {
                    type: String,
                    required: false
                },
                UOM: {
                    type: String,
                    required: false
                },
                currency: {
                    type: String,
                    required: false
                },
                materialCost: {
                    type: Number,
                    set: value => setTwoDecimal(value, 3),
                    required: false,
                    default: 0
                },
                conversionCost: {
                    type: Number,
                    set: value => setTwoDecimal(value, 3),
                    required: false,
                    default: 0
                },
                totalJWItemCost: {
                    type: Number,
                    set: value => setTwoDecimal(value, 3),
                    required: false,
                    default: 0
                }
            }
        ],
        revisionInfo: {
            revisionNo: {
                type: Number,
                required: false
            },
            revisionDate: {
                type: Date,
                required: false
            },
            reasonForRevision: {
                type: String,
                required: false
            },
            revisionProposedBy: {
                type: String,
                required: false
            },
            revisionApprovedBy: {
                type: String,
                required: false
            }
        },
        revisionHistory: []
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

JWIItemStdCostSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    this.revisionHistory.push(...this.jobWorkerDetails);
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
JWIItemStdCostSchema.plugin(paginatePlugin);
const JWIItemStdCost = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, JWIItemStdCostSchema);

module.exports = JWIItemStdCost;
const auditTrail = async (master, modifiedPaths, isNew, isModified) => {
    const {createdBy, updatedBy, company} = master;
    const auditTrail = {
        company: company,
        oldData: JSON.stringify(await master.constructor.findById(master._id)),
        data: JSON.stringify(master),
        user: isNew ? createdBy : updatedBy, // Replace with the actual current user's name
        action: isNew ? SCHEMA_CONSTANT.ADDED_ACTION : SCHEMA_CONSTANT.UPDATED_ACTION,
        fieldsModified: modifiedPaths.toString()
    };
    await Audit.auditModule(auditTrail);
};
