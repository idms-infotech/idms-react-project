const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {INVOICE_PAYMENT: SCHEMA_CONST} = require("../../mocks/schemasConstant/accountsConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const invoicePaymentSchema = new mongoose.Schema(
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
        customerName: {
            type: String,
            required: false
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Customer"
        },
        projectName: {
            type: String,
            required: false
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Project"
        },
        outstandingAmount: {
            type: Number,
            required: false
        },
        serviceInvoice: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "ServiceInvoice"
        },
        serviceInvoiceDate: {
            type: Date,
            required: true,
            default: new Date()
        },
        serviceInvoiceNumber: {
            type: String,
            required: false
        },
        totalValue: {
            type: Number,
            required: false
        },
        totalAmountWithTax: {
            type: Number,
            required: false
        },
        status: {
            type: String,
            required: false
        },
        paymentHistory: [
            {
                receivedAmount: {
                    type: Number,
                    required: false
                },
                receivedDate: {
                    type: Date,
                    required: false
                },
                invoiceDiscount: {
                    type: Number,
                    required: false
                },
                TDSAmount: {
                    type: Number,
                    required: false
                },
                paymentMode: {
                    type: String,
                    required: false
                }
            }
        ]
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

invoicePaymentSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
invoicePaymentSchema.plugin(paginatePlugin);
const InvoicePayment = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, invoicePaymentSchema);

module.exports = InvoicePayment;
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
