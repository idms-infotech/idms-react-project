const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {REASON_FOR_CN: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/settingsConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const reasonForCNSchema = new mongoose.Schema(
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
        reasonCategory: {
            type: String,
            required: false
        },
        reasonDesc: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: false,
            default: OPTIONS.defaultStatus.ACTIVE,
            enum: OPTIONS.defaultStatus.getCommonStatusAsArray()
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

reasonForCNSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;

    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
reasonForCNSchema.plugin(paginatePlugin);
const ReasonForCN = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, reasonForCNSchema);

module.exports = ReasonForCN;
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
