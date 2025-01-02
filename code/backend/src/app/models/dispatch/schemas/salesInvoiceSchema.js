const {
    Schema: {
        Types: {ObjectId}
    }
} = require("mongoose");
const {COMPANY, USER} = require("../../../mocks/schemasConstant/settingsConstant");
const {DISPATCH_REQUEST_NOTE} = require("../../../mocks/schemasConstant/salesConstant");
exports.SCHEMA = {
    company: {
        type: ObjectId,
        required: false,
        ref: COMPANY.COLLECTION_NAME
    },
    createdBy: {
        type: ObjectId,
        required: false,
        ref: USER.COLLECTION_NAME
    },
    updatedBy: {
        type: ObjectId,
        required: false,
        ref: USER.COLLECTION_NAME
    },
    customerCategory: {
        type: String,
        required: false
    },
    currency: {
        type: String,
        required: false
    },
    SPNumber: {
        type: String,
        required: true
    },
    DRNId: {
        type: ObjectId,
        required: true,
        ref: DISPATCH_REQUEST_NOTE.COLLECTION_NAME
    },
    DRNDate: {
        type: Date,
        required: false
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Customer"
    },
    billFromLocation: {
        type: String,
        required: false
    },
    SPTotalAmount: {
        type: Number,
        set: value => {
            if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                return parseFloat(value).toFixed(2);
            }
        },
        required: true
    },
    shipmentValue: {
        type: Number,
        set: value => {
            if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                return parseFloat(value).toFixed(2);
            }
        },
        required: true
    },
    SPV: {
        type: Number,
        set: value => {
            if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                return parseFloat(value).toFixed(2);
            }
        },
        required: false
    },
    SPDetails: [
        {
            SPLineNumber: {
                type: String,
                required: false
            },
            DRNLineNumber: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            SOId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: "SalesOrder"
            },
            SONumber: {
                type: String,
                required: false
            },
            SODate: {
                type: Date,
                required: false
            },
            SKU: {
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
            FGINId: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: "FGIN"
            },
            FGINMfgDate: {
                type: Date,
                required: false
            },
            batchDate: {
                type: String,
                required: false
            },
            FGINQty: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            standardRate: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: true
            },
            purchaseRate: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: true
            },
            discount: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: true
            },
            netRate: {
                // standardRate - (standardRate * discount)
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: true
            },
            dispatchQty: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: true
            },
            currency: {
                type: String,
                required: false
            },
            lineValue: {
                // orderedQty * netRate
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: true
            },
            SPVLine: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: true
            },
            invoicedQty: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false,
                default: 0
            },
            canceledQty: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false,
                default: 0
            },
            canceledReason: {
                type: String,
                required: false
            }
        }
    ],
    remarks: {
        type: String,
        required: false
    },
    otherCharges: {
        packagingAndForwarding: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false,
            default: 0
        },
        freight: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false,
            default: 0
        },
        insurance: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false,
            default: 0
        },
        loadingAndUnloading: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false,
            default: 0
        },
        miscellaneous: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false,
            default: 0
        },
        totalAmount: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false,
            default: 0
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
    paymentTerms: {
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
    packingList: {
        type: String,
        required: false
    },
    SPStatus: {
        type: String,
        required: true,
        // enum: ["Awaiting Approval", "Invoiced", "Rejected", "Closed", "Approved", "Report Generated"],
        enum: OPTIONS.defaultStatus.getAllShipmentPlanningStatusAsArray(),
        default: OPTIONS.defaultStatus.AWAITING_APPROVAL
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
    }
};
