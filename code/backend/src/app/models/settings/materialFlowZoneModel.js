const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {MATERIAL_FLOW_ZONE: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/settingsConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const materialFlowZoneSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Company"
        },
        processDetails: [
            {
                SN: {
                    type: Number,
                    required: false
                },
                materialFlowZone: {
                    type: String,
                    required: false
                },
                MFZCategory: {
                    type: String,
                    required: false
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
            revisionReqBy: {
                type: String,
                required: false
            },
            revisionAuthBy: {
                type: String,
                required: false
            }
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

materialFlowZoneSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;

    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
materialFlowZoneSchema.plugin(paginatePlugin);
const materialFlowZone = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, materialFlowZoneSchema);

module.exports = materialFlowZone;
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
