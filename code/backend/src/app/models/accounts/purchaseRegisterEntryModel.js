const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {PURCHASE_REGISTER_ENTRY: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/accountsConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin, reportPaginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const {OPTIONS} = require("../../helpers/global.options");
const purchaseRegistryEntrySchema = new mongoose.Schema(
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
        PEntryNo: {
            type: String,
            required: false
        },
        PEntryDate: {
            type: Date,
            required: false
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Supplier"
        },
        supplierName: {
            type: String,
            required: false
        },
        supplierGST: {
            type: String,
            required: false
        },
        supplierCurrency: {
            type: String,
            required: false
        },
        purchaseCategory: {
            type: String,
            required: false
        },
        taxInvoiceNo: {
            type: String,
            required: false
        },
        taxInvoiceDate: {
            type: Date,
            required: false
        },
        taxableAmt: {
            type: Number,
            required: false
        },
        SGSTAmt: {
            type: Number,
            required: false
        },
        CGSTAmt: {
            type: Number,
            required: false
        },
        IGSTAmt: {
            type: Number,
            required: false
        },
        totalAmt: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        TCSAmt: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        roundOffAmt: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        roundOffTotalAmt: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        remarks: {
            type: String,
            required: false
        },
        cancellationReason: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: [
                OPTIONS.defaultStatus.AWAITING_APPROVAL,
                OPTIONS.defaultStatus.CANCELLED,
                OPTIONS.defaultStatus.REPORT_GENERATED
            ],
            default: OPTIONS.defaultStatus.AWAITING_APPROVAL
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

purchaseRegistryEntrySchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.PEntryNo = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
purchaseRegistryEntrySchema.plugin(paginatePlugin);
purchaseRegistryEntrySchema.plugin(reportPaginatePlugin);
const purchaseRegistryEntry = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, purchaseRegistryEntrySchema);

module.exports = purchaseRegistryEntry;
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
