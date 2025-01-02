const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {SAMPLE_REQUEST: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/businessLeadsConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin, reportPaginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const {setTwoDecimal} = require("../../helpers/utility");
const sampleRequestSchema = new mongoose.Schema(
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
            required: false,
            ref: "Customer"
        },
        customerName: {
            type: String,
            required: false
        },
        quotationProformaRef: {
            type: mongoose.Schema.Types.ObjectId,
            required: false
            // ref: "QuotationProformaRef",
        },
        sampleReqNo: {
            type: String,
            required: false
        },
        SRType: {
            type: String,
            required: false,
            default: "Regular"
        },
        SRDate: {
            type: Date,
            required: true,
            default: new Date()
        },
        billFromLocation: {
            type: String,
            required: false
        },
        currency: {
            type: String,
            required: true
        },
        SRTargetDate: {
            type: Date,
            required: false
        },
        SRTotalAmount: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: true
        },
        SRDetails: [
            {
                SRLineNumber: {
                    type: Number,
                    required: false
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
                netRate: {
                    // standardRate - (standardRate * discount)
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: true
                },
                SRLineTargetDate: {
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
                JCCQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                previousJCCQty: {
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
                lineStatus: {
                    type: String,
                    required: false
                },
                dispatchCount: {
                    type: Number,
                    required: false
                },
                dispatchSchedule: [
                    {
                        scheduleNo: {
                            type: Number,
                            required: false
                        },
                        quantity: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        dispatchDate: {
                            type: Date,
                            required: false
                        },
                        PPICDate: {
                            type: Date,
                            required: false
                        }
                    }
                ]
            }
        ],
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
        billToAddress: {
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
        paymentTerms: {
            type: String,
            required: false
        },
        SRRemarks: {
            type: String,
            required: false
        },
        SRCancellationReason: {
            type: String,
            required: false
        },
        isActive: {
            type: Boolean,
            required: false,
            default: true
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
        SRStatus: {
            type: String,
            required: true,
            // enum: ["Created", "Invoiced", "Cancelled", "Closed", "Approved", "Report Generated"],
            enum: OPTIONS.defaultStatus.getAllSalesOrderStatusAsArray(),
            default: "Created"
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

sampleRequestSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.sampleReqNo = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
sampleRequestSchema.plugin(paginatePlugin);
sampleRequestSchema.plugin(reportPaginatePlugin);
const sampleRequest = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, sampleRequestSchema);

module.exports = sampleRequest;
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
