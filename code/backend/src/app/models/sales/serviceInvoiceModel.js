const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {OPTIONS} = require("../../helpers/global.options");
const {SERVICE_INVOICE: SCHEMA_CONST} = require("../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin, reportPaginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const serviceInvoiceSchema = new mongoose.Schema(
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
        serviceInvoiceNumber: {
            type: String,
            required: true
        },
        serviceInvoiceDate: {
            type: Date,
            required: true,
            default: new Date()
        },
        customerCategory: {
            type: String,
            required: true
        },
        categoryType: {
            type: String,
            required: false
        },
        customerName: {
            type: String,
            required: false
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Customer"
        },
        PONo: {
            type: String,
            required: false
        },
        PODate: {
            type: Date,
            required: false
        },
        currency: {
            type: String,
            required: false
        },
        billFromLocation: {
            type: String,
            required: false
        },
        serviceDetails: [
            {
                service: {
                    type: String,
                    required: false,
                    ref: "ServiceMaster"
                },
                serviceCode: {
                    type: String,
                    required: false
                },
                serviceDescription: {
                    type: String,
                    required: false
                },
                SACCode: {
                    type: String,
                    required: false
                },
                gstRate: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                igstRate: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                sgstRate: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                cgstRate: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                additionalInfo: {
                    type: String,
                    required: false
                },
                qty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                unitRate: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                lineValue: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                }
            }
        ],
        totalValue: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        paymentTerms: {
            type: String,
            required: false,
            default: "Within 30 Days"
        },
        totalCGSTAmount: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        totalSGSTAmount: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        totalIGSTAmount: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        totalTaxAmount: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        totalAmountWithTax: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        remarks: {
            type: String,
            required: false
        },
        GSTDetails: [
            {
                SACCode: {
                    type: String,
                    required: false
                },
                taxableValue: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                gstRate: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                igstRate: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                igstAmount: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                cgstRate: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                cgstAmount: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                sgstRate: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                sgstAmount: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                totalTax: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                totalValueWithTax: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                }
            }
        ],
        status: {
            type: String,
            required: false,
            // enum: ["Awaiting Approval", "Approved", "Report Generated"],
            enum: OPTIONS.defaultStatus.getAllServiceInvoiceAsArray(),
            default: OPTIONS.defaultStatus.AWAITING_APPROVAL
        },
        Irn: {
            type: String,
            required: false
        },
        AckDt: {
            type: String,
            required: false
        },
        AckNo: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        SignedQrCodeImgUrl: {
            type: String,
            required: false
        },
        InvoicePdfUrl: {
            type: String,
            required: false
        },
        IrnStatus: {
            type: String,
            required: false
        }
        // paymentStatus: {
        //     type: String,
        //     required: false,
        //     default: "Unpaid"
        // }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
serviceInvoiceSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.serviceInvoiceNumber = await getAndSetAutoIncrementNo(
            {...SCHEMA_CONST.AUTO_INCREMENT_DATA()},
            this.company,
            true
        );
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
serviceInvoiceSchema.index({status: -1});
serviceInvoiceSchema.index({serviceInvoiceDate: -1});
serviceInvoiceSchema.plugin(paginatePlugin);
serviceInvoiceSchema.plugin(reportPaginatePlugin);
const ServiceInvoice = mongoose.model("ServiceInvoice", serviceInvoiceSchema);

module.exports = ServiceInvoice;
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
