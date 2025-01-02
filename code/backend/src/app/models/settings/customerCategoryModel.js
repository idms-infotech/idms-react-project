const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {CUSTOMER_CATEGORY: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/settingsConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const customerCategorySchema = new mongoose.Schema(
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
        category: {
            type: String,
            required: true,
            unique: true
        },
        order: {
            type: Number,
            required: false
        },
        categoryType: {
            type: String,
            required: false
        },
        prefix: {
            type: String,
            required: true
        },
        nextAutoIncrement: {
            type: Number,
            required: true
        },
        digit: {
            type: Number,
            required: false,
            default: 4
        },
        categoryStatus: {
            type: String,
            required: false,
            enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
            default: OPTIONS.defaultStatus.ACTIVE
        },
        SOPrefix: {
            type: String,
            required: false
        },
        SONextAutoIncrement: {
            type: Number,
            required: false
        },
        SODigit: {
            type: Number,
            required: false,
            default: 4
        },
        SOCategoryStatus: {
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

customerCategorySchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
customerCategorySchema.plugin(paginatePlugin);
const customerCategory = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, customerCategorySchema);

module.exports = customerCategory;
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
