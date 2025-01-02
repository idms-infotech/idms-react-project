const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {SERVICE_CHARGES: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/settingsConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const serviceChargesSchema = new mongoose.Schema(
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
        order: {
            type: Number,
            required: false
        },
        description: {
            type: String,
            required: false
        },
        SACCode: {
            type: String,
            required: false
        },
        SAC: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "SAC"
        },
        GSTRate: {
            type: Number,
            required: false
        },
        IGSTRate: {
            type: Number,
            required: true
        },
        SGSTRate: {
            type: Number,
            required: true
        },
        CGSTRate: {
            type: Number,
            required: true
        },
        UGSTRate: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            required: false
        },
        serviceCharges: {
            type: Number,
            required: false
        },
        status: {
            type: String,
            required: false,
            default: OPTIONS.defaultStatus.ACTIVE
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

serviceChargesSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
serviceChargesSchema.plugin(paginatePlugin);
const serviceCharges = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, serviceChargesSchema);

module.exports = serviceCharges;
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
