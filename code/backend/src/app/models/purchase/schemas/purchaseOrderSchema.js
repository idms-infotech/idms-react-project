const {default: mongoose} = require("mongoose");
const {setTwoDecimal} = require("../../../helpers/utility");

exports.SCHEMA = {
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
    purchaseCategory: {
        type: String,
        required: true
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Supplier"
    },
    changedPaymentTerms: {
        type: String,
        required: false
    },
    PONumber: {
        type: String,
        required: true
    },
    PODate: {
        type: Date,
        required: true,
        default: new Date()
    },
    // enter
    orderReference: {
        type: String,
        required: false
    },
    // from supplier
    currency: {
        type: String,
        required: true
    },
    POType: {
        type: String,
        required: false
    },
    deliveryLocation: {
        type: String,
        required: false
    },
    freightTerms: {
        type: String,
        required: false
    },
    transporter: {
        type: String,
        required: false
    },
    deliveryDate: {
        type: Date,
        required: true,
        default: new Date()
    },
    PODetails: [
        {
            // sr no
            POLineNumber: {
                type: Number,
                required: false
            },
            item: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: "Items"
            },
            // from item
            UOM: {
                type: String,
                required: false
            },
            stdCostUom1: {
                type: Number,
                required: false,
                default: 0
            },
            stdCostUom2: {
                type: Number,
                required: false,
                default: 0
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
            unitConversion: {
                type: String,
                required: false
            },
            // enter
            POQty: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            // from item
            standardRate: {
                type: Number,
                set: value => setTwoDecimal(value, 3),
                required: false
            },
            // from item but editable
            purchaseRate: {
                type: Number,
                set: value => setTwoDecimal(value, 3),
                required: false
            },
            // POQty *  purchaseRate
            lineValue: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            // (POQty *  standardRate) - (POQty *  purchaseRate)
            linePPV: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            netRate: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            discount: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            // enter
            deliveryDate: {
                type: Date,
                required: false
            },
            gst: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false,
                default: 0
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
            lineRemarks: {
                type: String,
                required: false
            },
            receivedQty: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
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
            previousGRNQty: {
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
            markedForAlternateSupplier: {
                type: String,
                required: true,
                default: "No"
            },
            lineStatus: {
                type: String,
                required: false
            },
            deliveryCount: {
                type: Number,
                required: false
            },
            deliverySchedule: [
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
                    deliveryDate: {
                        type: Date,
                        required: false
                    }
                }
            ]
        }
    ],
    remarks: {
        type: String,
        required: false
    },
    PORemarks: {
        type: String,
        required: false
    },
    cancellationReason: {
        type: String,
        required: false
    },
    // sum of line value
    netPOValue: {
        type: Number,
        set: value => setTwoDecimal(value),
        required: false,
        default: 0
    },
    // sum of line PPv
    totalPPV: {
        type: Number,
        set: value => setTwoDecimal(value),
        required: false,
        default: 0
    },
    isActive: {
        type: String,
        required: false
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
    serviceChargesInfo: [
        {
            order: {
                type: Number,
                required: false
            },
            description: {
                type: String,
                required: false
            },
            SACCode: {
                type: String,
                required: false
            },
            SAC: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: "SAC"
            },
            GSTRate: {
                type: Number,
                required: false
            },
            IGSTRate: {
                type: Number,
                required: false
            },
            SGSTRate: {
                type: Number,
                required: false
            },
            CGSTRate: {
                type: Number,
                required: false
            },
            UGSTRate: {
                type: Number,
                required: false
            },
            currency: {
                type: String,
                required: false
            },
            serviceCharges: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            }
        }
    ],
    totalServiceCharges: {
        type: Number,
        set: value => setTwoDecimal(value),
        required: false
    },
    POValidity: {
        type: Date,
        required: false
    },
    POStatus: {
        type: String,
        required: true,
        enum: [
            "Awaiting Approval",
            "Approved",
            "Rejected",
            "Report Generated",
            "GRN Partial Created",
            "GRN Created",
            "Closed",
            "Cancelled",
            "Supplementary PO"
        ],
        default: "Awaiting Approval"
    }
};
