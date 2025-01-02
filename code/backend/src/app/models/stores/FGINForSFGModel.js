const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {FGIN_FOR_SFG: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/storesConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const FGINForSFGSchema = new mongoose.Schema(
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
        FGINNo: {
            type: String,
            required: false
        },
        FGINDate: {
            type: Date,
            required: false,
            default: new Date()
        },
        location: {
            type: String,
            required: false
        },
        SKUId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "SKUMaster"
        },
        SKUNo: {
            type: String,
            required: false
        },
        SKUName: {
            type: String,
            required: false
        },
        SKUDescription: {
            type: String,
            required: false
        },
        UOM: {
            type: String,
            required: false
        },
        DUC: {
            type: String,
            required: false
        },
        primaryUnit: {
            type: String,
            required: false
        },
        secondaryUnit: {
            type: String,
            required: false
        },
        jobCardNo: {
            type: String,
            required: false
        },
        manufacturingDate: {
            type: Date,
            required: true
        },
        expiryDate: {
            type: Date,
            required: false
        },
        shelfLife: {
            type: Number,
            required: false
        },
        producedQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        FGINQuantity: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: true
        },
        previousDRNQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        previousRecoQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        recoQtyPlusMinus: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        batchNo: {
            type: String,
            required: true
        },
        entryAuthorizedBy: {
            type: String,
            required: false
        },
        recoHistory: [],
        status: {
            type: String,
            required: false,
            default: "Created"
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

FGINForSFGSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.FGINNo = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
FGINForSFGSchema.plugin(paginatePlugin);
const FGINForSFG = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, FGINForSFGSchema);

module.exports = FGINForSFG;
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
