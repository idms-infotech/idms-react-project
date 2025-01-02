const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {DYNAMIC_FORMS: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/settingsConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const dynamicFormsSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Company"
        },
        type: {
            type: String,
            required: false
        },
        inputLabel: {
            type: String,
            required: true,
            trim: true
        },
        inputType: {
            type: String,
            required: true,
            enum: ["text", "select"]
        },
        inputValue: {
            type: String,
            required: false
        },
        validations: [],
        options: [
            {
                label: {type: String, required: false},
                value: {type: String, required: false}
            }
        ],
        order: {
            type: Number,
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
            default: OPTIONS.defaultStatus.ACTIVE
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

dynamicFormsSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
dynamicFormsSchema.plugin(paginatePlugin);
const dynamicForms = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, dynamicFormsSchema);

module.exports = dynamicForms;
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
