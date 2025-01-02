const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {PROFORMA_INVOICE: SCHEMA_CONST} = require("../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin, reportPaginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const proformaInvoiceSchema = new mongoose.Schema(
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
        salesCategory: {
            type: String,
            required: true
            // imports, domestic
        },
        categoryType: {
            type: String,
            required: false
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Customer"
        },
        quotationProformaRef: {
            type: mongoose.Schema.Types.ObjectId,
            required: false
            // ref: "QuotationProformaRef",
        },
        PINumber: {
            type: String,
            required: true
        },
        PIDate: {
            type: Date,
            required: true,
            default: new Date()
        },
        PONumber: {
            //orderReference
            type: String,
            required: true
        },
        PODate: {
            type: Date,
            required: true
        },
        currency: {
            type: String,
            required: true
        },
        PIValidityDate: {
            type: Date,
            required: false
        },
        PITotalAmount: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: true
        },
        billFromLocation: {
            type: String,
            required: false
        },
        PIDetails: [
            {
                PILineNumber: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: true
                },
                SKU: {
                    //sku no.
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "SKUMaster"
                },
                UOM: {
                    type: String,
                    required: false
                },
                customerPartNo: {
                    type: String,
                    required: false
                },
                standardRate: {
                    // rate/unit
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: true
                },
                discount: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: true
                },
                netRate: {
                    // standardRate - (standardRate * discount)
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: true
                },
                SOLineTargetDate: {
                    type: Date,
                    required: false
                },
                orderedQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: true
                },
                lineValue: {
                    // orderedQty * netRate
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
                balancedQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                previousDRNQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                canceledQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                canceledReason: {
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
                rateType: {
                    type: String,
                    required: false
                },
                sellingRateCommon: [
                    {
                        currency: {
                            type: String,
                            required: false
                        },
                        unit1: {
                            type: String,
                            required: false
                        },
                        MOQ1: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        rate1: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        unit2: {
                            type: String,
                            required: false
                        },
                        MOQ2: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        rate2: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        select: {
                            type: Boolean,
                            required: false
                        }
                    }
                ]
            }
        ],
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
            country: {
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
        billFromAddress: {
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
            line4: {
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
            country: {
                type: String,
                required: false,
                trim: true
            }
        },
        paymentTerms: {
            type: String,
            required: false
        },
        modeOfTransport: {
            type: String,
            required: false
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
        destination: {
            type: String,
            required: false
        },
        PIRemarks: {
            type: String,
            required: false
        },
        PICancellationReason: {
            type: String,
            required: false
        },
        isActive: {
            type: Boolean,
            required: false,
            default: true
        },
        PIStatus: {
            type: String,
            required: true,
            enum: ["Created", "Rejected", "Closed", "Auto Closed", "Converted to SO", "Approved", "Report Generated"],
            default: "Created"
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

proformaInvoiceSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;

    if (this.isNew) {
        this.PINumber = await getAndSetAutoIncrementNo({...SCHEMA_CONST.AUTO_INCREMENT_DATA()}, this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
proformaInvoiceSchema.index({PIStatus: -1});
proformaInvoiceSchema.index({PIDate: -1});
proformaInvoiceSchema.plugin(paginatePlugin);
proformaInvoiceSchema.plugin(reportPaginatePlugin);
const ProformaInvoice = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, proformaInvoiceSchema);

module.exports = ProformaInvoice;
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
