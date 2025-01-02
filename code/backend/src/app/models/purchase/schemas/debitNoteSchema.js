const {default: mongoose} = require("mongoose");
const {SUPPLIER, ITEMS} = require("../../../mocks/schemasConstant/purchaseConstant");
const {OTHER_CHARGES} = require("../../commonSchemas/commonSchemas");
exports.SCHEMA = {
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
    DNNumber: {
        type: String,
        required: true
    },
    DNDate: {
        type: Date,
        required: true,
        default: new Date()
    },
    purchaseCategory: {
        type: String,
        required: true
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: SUPPLIER.COLLECTION_NAME
    },
    invoiceNo: {
        type: String,
        required: false
    },
    invoiceDate: {
        type: Date,
        required: true,
        default: new Date()
    },
    currency: {
        type: String,
        required: true
    },
    DNDetails: [
        {
            DNLineNumber: {
                type: Number,
                required: false
            },
            item: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: ITEMS.COLLECTION_NAME
            },
            UOM: {
                type: String,
                required: false
            },
            // from item
            primaryUnit: {
                type: String,
                required: false
            },
            // enter
            MRNRejectedQty: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            returnQty: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            // balancedQty: {
            //   type: Number,
            //   set: value => {
            //     if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
            //         return parseFloat(value).toFixed(2);
            //     }
            // },
            //     required: false,
            //     default: 0,
            // },
            // previousMRNQty: {
            //    type: Number,
            //    set: value => {
            //     if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
            //         return parseFloat(value).toFixed(2);
            //     }
            // },
            //     required: false,
            //     default: 0,
            // },
            // from item
            standardRate: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            // from item but editable
            purchaseRate: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            // POQty *  purchaseRate
            lineValue: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            hsn: {
                type: String,
                required: false
            },
            gst: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false,
                default: 0
            },
            igst: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false,
                default: 0
            },
            cgst: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false,
                default: 0
            },
            sgst: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false,
                default: 0
            }
        }
    ],
    reasonForDN: {
        type: String,
        required: false
    },
    remarks: {
        type: String,
        required: false
    },
    netDNValue: {
        type: Number,
        set: value => {
            if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                return parseFloat(value).toFixed(2);
            }
        },
        required: false,
        default: 0
    },
    otherCharges: OTHER_CHARGES,
    DNStatus: {
        type: String,
        required: true,
        enum: ["Awaiting Approval", "Approved", "Rejected", "Report Generated", "Closed"],
        default: "Awaiting Approval"
    }
};
