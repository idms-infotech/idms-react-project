const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {OPTIONS} = require("../../helpers/global.options");
const {ASSET_CLASS: SCHEMA_CONST} = require("../../mocks/schemasConstant/settingsConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const assetClassSchema = new mongoose.Schema(
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
        order: {
            type: Number,
            required: false
        },
        assetClassName: {
            type: String,
            required: true
        },
        prefix: {
            type: String,
            required: true
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
        depreciation: {
            type: Boolean,
            required: false
        },
        energySpecification: {
            type: Boolean,
            required: false
        },
        maintenance: {
            type: Boolean,
            required: false
        },
        calibration: {
            type: Boolean,
            required: false
        },
        type: {
            type: String,
            required: true,
            enum: ["Tangible", "Intangible"],
            default: "Tangible"
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
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
assetClassSchema.plugin(paginatePlugin);
assetClassSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

const AssetClass = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, assetClassSchema);

module.exports = AssetClass;
const auditTrail = async (master, modifiedPaths, isNew, isModified) => {
    const {createdBy, updatedBy, company} = master;
    const auditTrail = {
        company: company,
        oldData: JSON.stringify(await master.constructor.findById(master._id)),
        data: JSON.stringify(master),
        user: isNew ? createdBy : updatedBy,
        action: isNew ? SCHEMA_CONST.ADDED_ACTION : SCHEMA_CONST.UPDATED_ACTION,
        fieldsModified: modifiedPaths.toString()
    };
    await Audit.auditModule(auditTrail);
};
