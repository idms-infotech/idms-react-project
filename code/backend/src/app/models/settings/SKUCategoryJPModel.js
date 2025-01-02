const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {SKU_CATEGORY_JP: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/settingsConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const {OPTIONS} = require("../../helpers/global.options");
const SKUCategoryJPSchema = new mongoose.Schema(
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
        SKUCategoryName: {
            type: String,
            required: true,
            unique: true
        },
        SKUCategoryPrefix: {
            type: String,
            required: true
        },
        productCode: {
            type: String,
            required: false
        },
        displayProductCategoryName: {
            type: String,
            required: false
        },
        application: {
            type: String,
            required: false
        },
        digit: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 4
        },
        SKUCategoryAutoIncrement: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: true
        },
        categoryStatus: {
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

SKUCategoryJPSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
SKUCategoryJPSchema.plugin(paginatePlugin);
const SKUCategoryJP = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, SKUCategoryJPSchema);

module.exports = SKUCategoryJP;
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
