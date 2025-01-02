const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {ITEM_CATEGORY: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/purchaseConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const itemCategorySchema = new mongoose.Schema(
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
        order: {
            type: Number,
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
        },
        stockPreparation: {
            type: Boolean,
            required: false,
            default: false
        },
        inkMaster: {
            type: Boolean,
            required: false,
            default: false
        },
        jobWorkItem: {
            type: Boolean,
            required: false,
            default: false
        },
        planningItemMaster: {
            type: Boolean,
            required: false,
            default: false
        },
        BOMProdItem: {
            type: Boolean,
            required: false,
            default: false
        },
        packingStandard: {
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

itemCategorySchema.pre("save", async function (next) {
    const {isNew, isModified} = this;

    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
itemCategorySchema.index({categoryStatus: -1});
itemCategorySchema.plugin(paginatePlugin);
const ItemCategory = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, itemCategorySchema);

module.exports = ItemCategory;
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
