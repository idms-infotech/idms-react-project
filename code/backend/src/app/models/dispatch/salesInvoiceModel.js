const mongoose = require("mongoose");
const {getCompanyLocationsWithGST} = require("../../controllers/v1/settings/company/company");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {OPTIONS} = require("../../helpers/global.options");
const {SALES_INVOICE: SCHEMA_CONST} = require("../../mocks/schemasConstant/dispatchConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {reportPaginatePlugin, paginatePlugin} = require("../plugins/paginatePlugin");
const AutoIncrementRepository = require("../settings/repository/autoIncrementRepository");
const {setTwoDecimal} = require("../../helpers/utility");
const salesInvoiceSchema = new mongoose.Schema(
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
        salesInvoiceNumber: {
            type: String,
            required: false
        },
        salesInvoiceDate: {
            type: Date,
            required: true,
            default: new Date()
        },
        shipmentPlanningId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "ShipmentPlanning"
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Customer"
        },
        salesInvoiceTotalAmountWithTax: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        billFromLocation: {
            type: String,
            required: false
        },
        customerCategory: {
            type: String,
            required: false
        },
        categoryType: {
            type: String,
            required: false
        },
        customerBillingAddress: {
            line1: {
                type: String,
                required: false,
                trim: true
            },
            line2: {
                type: String,
                required: false,
                trim: true
            },
            line3: {
                type: String,
                required: false,
                trim: true
            },
            state: {
                type: String,
                required: false,
                trim: true
            },
            city: {
                type: String,
                required: false,
                trim: true
            },
            district: {
                type: String,
                required: false,
                trim: true
            },
            pinCode: {
                type: String,
                required: false,
                trim: true
            },
            contactPersonName: {
                type: String,
                required: false,
                trim: true
            },
            contactPersonNumber: {
                type: String,
                required: false,
                trim: true
            }
        },
        customerShippingAddress: {
            line1: {
                type: String,
                required: false,
                trim: true
            },
            line2: {
                type: String,
                required: false,
                trim: true
            },
            line3: {
                type: String,
                required: false,
                trim: true
            },
            state: {
                type: String,
                required: false,
                trim: true
            },
            city: {
                type: String,
                required: false,
                trim: true
            },
            district: {
                type: String,
                required: false,
                trim: true
            },
            pinCode: {
                type: String,
                required: false,
                trim: true
            },
            contactPersonName: {
                type: String,
                required: false,
                trim: true
            },
            contactPersonNumber: {
                type: String,
                required: false,
                trim: true
            },
            GSTIN: {
                type: String,
                required: false,
                trim: true
            }
        },
        salesInvoiceStatus: {
            type: String,
            required: true,
            // enum: ["Created", "Closed", "Approved", "Rejected", "Report Generated"],
            enum: OPTIONS.defaultStatus.getAllSalesInvoiceStatusAsArray(),
            default: OPTIONS.defaultStatus.CREATED
        },
        paymentTerms: {
            type: String,
            required: true,
            default: "Within 30 Days"
        },
        salesInvoiceTotalAmount: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: true
        },
        salesInvoiceTotalCGSTAmount: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        salesInvoiceTotalSGSTAmount: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        salesInvoiceTotalIGSTAmount: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        salesInvoiceTotalUGSTAmount: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        salesInvoiceTotalTaxAmount: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        salesInvoiceDetails: [
            {
                salesInvoiceLineNumber: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: true
                },
                SONumber: {
                    type: String,
                    required: false
                },
                SOId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "SalesOrder"
                },
                SPLineNumber: {
                    type: String,
                    required: false
                },
                batchId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "FGIN"
                },
                batchDate: {
                    type: Date,
                    required: false
                },
                tBatchNo: {
                    type: String,
                    required: false
                },
                SKU: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "SKUMaster"
                },
                dispatchQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: true
                },
                invoicedQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                discount: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                purchaseRate: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                unit: {
                    type: String,
                    required: false
                },
                salesInvoiceUnitRate: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: true
                },
                salesInvoiceLineValue: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: true
                },
                HSN: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "HSN"
                },
                HSNCode: {
                    type: String,
                    required: false
                },
                igst: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                cgst: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                sgst: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                ugst: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                IgstAmt: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                CgstAmt: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                SgstAmt: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                }
            }
        ],
        GSTDetails: [
            {
                HSNCode: {
                    type: String,
                    required: false
                },
                taxableValue: {
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
                ugstRate: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                ugstAmount: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                totalTaxableValue: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                }
            }
        ],
        otherCharges: {
            packagingAndForwarding: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false,
                default: 0
            },
            freight: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false,
                default: 0
            },
            insurance: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false,
                default: 0
            },
            loadingAndUnloading: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false,
                default: 0
            },
            miscellaneous: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false,
                default: 0
            },
            totalAmount: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false,
                default: 0
            }
        },
        frightCharge: {
            type: String,
            required: false
        },
        frightTerms: {
            type: String,
            required: false
        },
        transporter: {
            type: String,
            required: false
        },
        modeOfTransport: {
            type: String,
            required: false
        },
        destination: {
            type: String,
            required: false
        },
        roundedOff: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        // paymentDueDate: {
        //     type: Date,
        //     required: false,
        //     default: new Date(),
        // },
        validUpto: {
            type: String,
            required: false
        },
        ewayBillNo: {
            type: String,
            required: false
        },
        ewayBillDate: {
            type: String,
            required: false
        },
        EWayBillPdfUrl: {
            type: String,
            required: false
        },
        EWayBillQrCodeUrl: {
            type: String,
            required: false
        },
        eWayBillStatus: {
            type: String,
            required: false
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
        },
        isDispatched: {
            type: Boolean,
            required: false,
            default: false
        },
        isPDIR: {
            type: Boolean,
            required: false,
            default: false
        },
        PINumber: {
            type: String,
            required: false
        },
        PIDate: {
            type: Date,
            required: false
        },
        PONumber: {
            type: String,
            required: false
        },
        PODate: {
            type: Date,
            required: false
        },
        exportsInfo: {
            exportsInvoiceNo: {
                type: String,
                required: false
            },
            exportsInvoiceDate: {
                type: Date,
                required: false
            },
            exportsInvoiceTotalValue: {
                type: Number,
                required: false
            },
            exchangeRate: {
                type: Number,
                required: false
            },
            finalDestination: {
                type: String,
                required: false
            }
        },
        eInvoiceStatus: {
            type: Boolean,
            required: false,
            default: false
        },
        eWayBillStatus: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

salesInvoiceSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;

    if (this.isNew) {
        let locations = await getCompanyLocationsWithGST(this.company);
        let location = locations.find(x => x.locationID == this.billFromLocation)?.GSTINForAdditionalPlace ?? null;
        const salesInvObj = await AutoIncrementRepository.findOneDoc(
            {
                moduleName: SCHEMA_CONST.MODULE_NAME,
                module: SCHEMA_CONST.MODULE
            },
            {
                modulePrefix: 1,
                digit: 1,
                _id: 0
            }
        );
        let subAutoIncrement = {
            location,
            digit: salesInvObj?.digit ?? 4,
            modulePrefix: salesInvObj?.modulePrefix ?? SCHEMA_CONST.MODULE_PREFIX
        };
        this.salesInvoiceNumber = await getAndSetAutoIncrementNo(
            {...SCHEMA_CONST.AUTO_INCREMENT_DATA(), subAutoIncrement},
            this.company,
            true
        );
        // const autoIncrementedNo = await AutoIncrement.getNextId(
        //     "SalesOrder",
        //     SALES_INVOICE_MODULE_PREFIX,
        //     this.company,
        //     GSTINForAdditionalPlace
        // );
        // this.salesInvoiceNumber = getAutoIncrementNumber(prefixValue, "", autoIncrementedNo, +digit);
        // await AutoIncrement.setNextId("SalesOrder", SALES_INVOICE_MODULE_PREFIX, this.company, GSTINForAdditionalPlace);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
salesInvoiceSchema.index({salesInvoiceStatus: -1});
salesInvoiceSchema.plugin(paginatePlugin);
salesInvoiceSchema.plugin(reportPaginatePlugin);
const SalesInvoice = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, salesInvoiceSchema);
module.exports = SalesInvoice;
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
