const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {ITEM_CATEGORY_JP: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/settingsConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const itemCategoryJPSchema = new mongoose.Schema(
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
        application: {
            type: String,
            required: false
        },
        subCategory: [
            {
                name: {
                    type: String,
                    required: false
                },
                prefix: {
                    type: String,
                    required: false
                },
                subCategoryStatus: {
                    type: String,
                    required: false,
                    enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
                    default: OPTIONS.defaultStatus.ACTIVE
                },
                subCategoryAutoIncrement: {
                    type: Number,
                    required: true
                },
                digit: {
                    type: Number,
                    required: false,
                    default: 4
                }
            }
        ],
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
        BOM: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

itemCategoryJPSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    // if (this.isNew) {

    // }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
itemCategoryJPSchema.plugin(paginatePlugin);
const itemCategoryJP = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, itemCategoryJPSchema);

module.exports = itemCategoryJP;
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
