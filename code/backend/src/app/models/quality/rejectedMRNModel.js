const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {REJ_QTY_MANAGEMENT: SCHEMA_CONST} = require("../../mocks/schemasConstant/qualityConstant");
const {OPTIONS} = require("../../helpers/global.options");
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
        MRN: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "MRN"
        },
        MRNNumber: {
            type: String
        },
        deliveryLocation: {
            type: String,
            required: false
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            refPath: "supplierRef"
        },
        supplierRef: {
            type: String,
            enum: ["Customer", "Supplier"],
            default: "Supplier"
        },
        supplierName: {
            type: String,
            required: false
        },
        item: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            refPath: "referenceModel"
        },
        referenceModel: {
            type: String,
            enum: ["Items", "ProductionItem"],
            default: "Items"
        },
        itemType: {
            type: String,
            required: false
        },
        primaryToSecondaryConversion: {
            type: Number,
            required: false
        },
        secondaryToPrimaryConversion: {
            type: Number,
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
        conversionOfUnits: {
            type: String,
            required: false
        },
        UOM: {
            type: String,
            required: false
        },
        standardRate: {
            type: Number,
            set: value => setTwoDecimal(value, 3),
            required: false
        },
        purchaseRate: {
            type: Number,
            set: value => setTwoDecimal(value, 3),
            required: false
        },
        batchDate: {
            type: Date,
            required: false
        },
        QCLevels: {
            type: String,
            required: false
        },
        QRTQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: [OPTIONS.defaultStatus.CLOSED, OPTIONS.defaultStatus.CREATED],
            default: OPTIONS.defaultStatus.CREATED
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
schema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

const RejectedMRN = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, schema);

module.exports = RejectedMRN;
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
