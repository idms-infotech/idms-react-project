const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {PRODUCTION_UNIT_CONFIG: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/planningConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const productionUnitConfigSchema = new mongoose.Schema(
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
        srNo: {
            type: Number,
            required: false
        },
        prodUnitName: {
            type: String,
            required: false
        },
        prodUnitCode: {
            type: String,
            required: false,
            unique: true,
            uppercase: true
        },
        SKUFlag: {
            type: Boolean,
            required: false,
            default: false
        },
        formulationFlag: {
            type: Boolean,
            required: false,
            default: false
        },
        materialFlag: {
            type: Boolean,
            required: false,
            default: false
        },
        batchIncNum: {
            type: Number,
            required: false,
            default: 1
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

productionUnitConfigSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    this.revisionHistory.push({
        srNo: this.srNo,
        prodUnitName: this.prodUnitName,
        prodUnitCode: this.prodUnitCode,
        status: this.status,
        revisionInfo: this.revisionInfo
    });
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
productionUnitConfigSchema.plugin(paginatePlugin);
const ProductionUnitConfig = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, productionUnitConfigSchema);

module.exports = ProductionUnitConfig;
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
