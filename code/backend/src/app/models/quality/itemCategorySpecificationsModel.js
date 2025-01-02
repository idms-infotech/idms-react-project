const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {ITEM_CATEGORY_SPECIFICATIONS: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/qualityConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const itemCategorySpecificationsSchema = new mongoose.Schema(
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
        itemCategory: {
            type: String,
            required: false
        },
        application: {
            type: String,
            required: false
        },
        specificationInfo: [
            {
                seq: {
                    type: Number,
                    required: false
                },
                specificationCode: {
                    type: String,
                    required: false
                },
                characteristic: {
                    type: String,
                    required: false
                },
                UOM: {
                    type: String,
                    required: false
                },
                testStandard: {
                    type: String,
                    required: false
                },
                measuringInstrument: {
                    type: String,
                    required: false
                },
                specValue: {
                    type: String,
                    required: false
                },
                tolerance: {
                    type: Number,
                    required: false
                },
                LTL: {
                    type: String,
                    required: false
                },
                UTL: {
                    type: String,
                    required: false
                }
            }
        ],
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

itemCategorySpecificationsSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
itemCategorySpecificationsSchema.plugin(paginatePlugin);
const itemCategorySpecifications = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, itemCategorySpecificationsSchema);

module.exports = itemCategorySpecifications;
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
