const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {PLANNING_ITEM_MASTER: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/planningConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal, getIncrementNumWithPrefix} = require("../../helpers/utility");
const {OPTIONS} = require("../../helpers/global.options");
const {
    setItemsJPNextAutoIncrementNo,
    getAllItemCategoryJP
} = require("../../controllers/v1/settings/itemCategoryJP/itemCategoryJP");
const planningItemMasterSchema = new mongoose.Schema(
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
        itemCode: {
            type: String,
            required: false
        },
        itemName: {
            type: String,
            required: false
        },
        itemDescription: {
            type: String,
            required: false
        },
        UOM: {
            type: String,
            required: false
        },
        HSNId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "User"
        },
        HSNCode: {
            type: Number,
            required: false
        },
        gst: {
            type: Number,
            required: false,
            default: 0
        },
        igst: {
            type: Number,
            required: false,
            default: 0
        },
        cgst: {
            type: Number,
            required: false,
            default: 0
        },
        sgst: {
            type: Number,
            required: false,
            default: 0
        },
        ugst: {
            type: Number,
            required: false,
            default: 0
        },
        shelfLife: {
            type: Number,
            required: false
        },
        QCLevels: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
            default: OPTIONS.defaultStatus.ACTIVE
        },
        JWPrincipalDetails: [
            {
                JWPrincipal: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "JWPrincipal"
                },
                JWPrincipalName: {
                    type: String,
                    required: false
                },
                mfrPartNo: {
                    type: String,
                    required: false
                },
                mfrPartDescription: {
                    type: String,
                    required: false
                },
                UOM: {
                    type: String,
                    required: false
                },
                currency: {
                    type: String,
                    required: false
                },
                itemValue: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                }
            }
        ]
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

planningItemMasterSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        const itemCategoryList = await getAllItemCategoryJP(this.company);
        let category = itemCategoryList.find(x => this.itemCategory == x.category);
        if (!!category) {
            this.itemCode = getIncrementNumWithPrefix({
                modulePrefix: category.prefix,
                autoIncrementValue: category.nextAutoIncrement,
                digit: category.digit
            });
            await setItemsJPNextAutoIncrementNo(this.itemCategory);
        }
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
planningItemMasterSchema.plugin(paginatePlugin);
const planningItemMaster = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, planningItemMasterSchema);

module.exports = planningItemMaster;
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
