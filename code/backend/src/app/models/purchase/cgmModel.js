const mongoose = require("mongoose");
const {CONSTANTS} = require("../../../config/config");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {CAPITAL_GOODS_CGM: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/purchaseConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const HSNRepository = require("./repository/hsnRepository");

const cgmSchema = new mongoose.Schema(
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
        capitalGoodsNo: {
            type: String,
            required: true
        },
        capitalGoodsName: {
            type: String,
            required: true
        },
        capitalGoodsDescription: {
            type: String,
            required: true
        },
        capitalGoodsSpecification: {
            type: String,
            required: false
        },
        hsnCode: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "HSN"
        },
        UOM: {
            type: String,
            required: true
        },
        technicalSheetFile: {
            type: String,
            required: false
        },
        supplierInfo: {
            supplier: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: "Supplier"
            },
            supplierPartNo: {
                type: String,
                required: false
            },
            currency: {
                type: String,
                required: false
            },
            purchaseCost: {
                type: Number,
                required: true
            }
        },
        isActive: {
            type: Boolean,
            required: false,
            default: true
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);
cgmSchema.set("toJSON", {virtuals: true});

cgmSchema.virtual("technicalSheetFileUrl").get(function () {
    if (this.technicalSheetFile && this.technicalSheetFile != "undefined") {
        return CONSTANTS.domainUrl + "technicalSheet/" + this.technicalSheetFile;
    }
});
cgmSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        await HSNRepository.findAndUpdateDoc({_id: hsnCode}, {isTransaction: true});
        this.capitalGoodsNo = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
cgmSchema.plugin(paginatePlugin);
const CapitalGoods = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, cgmSchema);

module.exports = CapitalGoods;
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
