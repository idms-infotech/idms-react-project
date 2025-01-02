const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {CURRENCY_MASTER: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/settingsConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const currencyMasterSchema = new mongoose.Schema(
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
        currencyCode: {
            type: String,
            required: false
        },
        currencyOriginalName: {
            type: String,
            required: false
        },
        currencyName: {
            type: String,
            required: false
        },
        symbol: {
            type: String,
            required: false
        },
        exchangeRateToUSD: {
            type: String,
            required: false
        },
        sequence: {
            type: String,
            required: false
        },
        decimal: {
            type: Number,
            required: false
        },
        status: {
            type: String,
            required: false,
            default: OPTIONS.defaultStatus.ACTIVE,
            enum: OPTIONS.defaultStatus.getCommonStatusAsArray()
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

currencyMasterSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.currencyCode = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
currencyMasterSchema.plugin(paginatePlugin);
const currencyMaster = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, currencyMasterSchema);

module.exports = currencyMaster;
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
