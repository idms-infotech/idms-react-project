const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {PROD_PROCESS_CONFIG: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/planningConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const prodProcessConfigSchema = new mongoose.Schema(
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
        prodUnitConfigId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "ProductionUnitConfig"
        },
        srNo: {
            type: Number,
            required: false
        },
        prodProcessName: {
            type: String,
            required: false
        },
        processOriginalName: {
            type: String,
            required: false
        },
        qualityOriginalName: {
            type: String,
            required: false
        },
        source: {
            type: String,
            required: false,
            uppercase: true
        },
        status: {
            type: String,
            required: false,
            enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
            default: OPTIONS.defaultStatus.ACTIVE
        },
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

prodProcessConfigSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    this.revisionHistory.push({
        srNo: this.srNo,
        prodProcessName: this.prodProcessName,
        source: this.source,
        status: this.status,
        revisionInfo: this.revisionInfo
    });
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
prodProcessConfigSchema.plugin(paginatePlugin);
const prodProcessConfig = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, prodProcessConfigSchema);

module.exports = prodProcessConfig;
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
