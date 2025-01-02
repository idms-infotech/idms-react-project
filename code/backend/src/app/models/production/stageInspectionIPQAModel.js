const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {STAGE_INSPECTION_IPQA: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/productionConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const {OPTIONS} = require("../../helpers/global.options");
const stageInspectionIPQASchema = new mongoose.Schema(
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
        jobCard: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "JobCardCreation"
        },
        SKUProcessFlow: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "SKUProcessFlow"
        },
        jobCardNo: {
            type: String,
            required: false
        },
        SKU: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "SKUMaster"
        },
        SKUNo: {
            type: String,
            required: false
        },
        SKUName: {
            type: String,
            required: false
        },
        SKUDescription: {
            type: String,
            required: false
        },
        stageInspectionIPQAInfo: [
            {
                date: {
                    type: Date,
                    required: false
                },
                shift: {
                    type: String,
                    required: false
                },
                UOM: {
                    type: String,
                    required: false
                },
                okQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                inspectedBy: {
                    type: String,
                    required: false
                }
            }
        ],

        totalOkQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        remarks: {
            type: String,
            required: false
        },
        batchReleaseStatus: {
            type: String,
            required: false,
            enum: [
                OPTIONS.defaultStatus.RELEASED,
                OPTIONS.defaultStatus.REWORKED,
                OPTIONS.defaultStatus.DEVIATION,
                OPTIONS.defaultStatus.REJECTED
            ]
        },
        processInCharge: {
            type: String,
            required: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

stageInspectionIPQASchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
stageInspectionIPQASchema.plugin(paginatePlugin);
const stageInspectionIPQA = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, stageInspectionIPQASchema);

module.exports = stageInspectionIPQA;
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
