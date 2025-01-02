const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {KIT_CATEGORY: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/settingsConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const {setTwoDecimal} = require("../../helpers/utility");
const KITCategorySchema = new mongoose.Schema(
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
        categoryName: {
            type: String,
            required: true,
            unique: true
        },
        categoryPrefix: {
            type: String,
            required: true
        },
        BOMPrefix: {
            type: String,
            required: true
        },
        productCode: {
            type: String,
            required: false
        },
        displayCategoryName: {
            type: String,
            required: false
        },
        application: {
            type: String,
            required: false
        },
        order: {
            type: Number,
            required: false
        },
        digit: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 4
        },
        autoIncrementNo: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: true
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

KITCategorySchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
KITCategorySchema.plugin(paginatePlugin);
const KITCategory = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, KITCategorySchema);

module.exports = KITCategory;
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
