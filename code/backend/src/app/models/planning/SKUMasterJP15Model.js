const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {SKU_MASTER_JP15: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/planningConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {getAutoIncrementNumber, setTwoDecimal} = require("../../helpers/utility");
const {OPTIONS} = require("../../helpers/global.options");
const {
    getAllSKUCategoryJP15,
    setSKUMasterJPAutoIncrementNo
} = require("../../controllers/v1/settings/SKUCategoryJP/SKUCategoryJP");
const SKUMasterJP15Schema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
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
        SKUStage: {
            type: String,
            required: true
        },
        SKUNo: {
            type: String,
            required: false
        },
        productCategory: {
            type: String,
            required: false
        },
        SKUName: {
            type: String,
            required: true
        },
        SKUDescription: {
            type: String,
            required: true
        },
        HSNId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "SaleHSN"
        },
        hsn: {
            type: String,
            required: false
        },
        UOM: {
            type: String,
            required: false
        },
        shelfLife: {
            type: Number,
            set: value => setTwoDecimal(value, 1),
            required: false
        },
        JWPrincipalInfo: [
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
                JWPPartNo: {
                    type: String,
                    required: false
                },
                JWPPartDescription: {
                    type: String,
                    required: false
                },
                currency: {
                    type: String,
                    required: false
                },
                UOM: {
                    type: String,
                    required: false
                },
                standardSellingRate: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                }
            }
        ],
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

SKUMasterJP15Schema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        const SKUCategoryList = await getAllSKUCategoryJP15(this.company, this.productCategory);
        if (!!SKUCategoryList && SKUCategoryList.length > 0) {
            this.SKUNo = getAutoIncrementNumber(
                SKUCategoryList[0].SKUCategoryPrefix,
                "",
                SKUCategoryList[0].SKUCategoryAutoIncrement,
                SKUCategoryList[0].digit
            );
            await setSKUMasterJPAutoIncrementNo(this.productCategory);
        } else {
            this.SKUNo = await getAndSetAutoIncrementNo({...SCHEMA_CONSTANT.AUTO_INCREMENT_DATA()}, this.company, true);
        }
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
SKUMasterJP15Schema.plugin(paginatePlugin);
const SKUMasterJP15 = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, SKUMasterJP15Schema);

module.exports = SKUMasterJP15;
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
