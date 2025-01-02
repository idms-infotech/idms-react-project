const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {OPTIONS} = require("../../helpers/global.options");
const {PROD_ITEM_CATEGORY: SCHEMA_CONST} = require("../../mocks/schemasConstant/settingsConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const schema = new mongoose.Schema(
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
        label: {
            type: String,
            required: false,
            trim: true
        },
        category: {
            type: String,
            required: true,
            trim: true
        },
        categoryCode: {
            type: String,
            required: false,
            trim: true
        },
        prefix: {
            type: String,
            required: true
        },
        BOMPrefix: {
            type: String,
            required: false,
            trim: true
        },
        costSheetPrefix: {
            type: String,
            required: false,
            trim: true
        },
        type: {
            type: String,
            required: false
        },
        nextAutoIncrement: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: true
        },
        digit: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 4
        },
        prodUnitConfigId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "ProductionUnitConfig"
        },
        prodUnitName: {
            type: String,
            required: false
        },
        inkMaster: {
            type: Boolean,
            required: false,
            default: false
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
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
schema.plugin(paginatePlugin);
schema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

const ProdItemCategory = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, schema);

module.exports = ProdItemCategory;
const auditTrail = async (master, modifiedPaths, isNew, isModified) => {
    const {createdBy, updatedBy, company} = master;
    const auditTrail = {
        company: company,
        oldData: JSON.stringify(await master.constructor.findById(master._id)),
        data: JSON.stringify(master),
        user: isNew ? createdBy : updatedBy, // Replace with the actual current user's name
        action: isNew ? SCHEMA_CONST.ADDED_ACTION : SCHEMA_CONST.UPDATED_ACTION,
        fieldsModified: modifiedPaths.toString()
    };
    await Audit.auditModule(auditTrail);
};
