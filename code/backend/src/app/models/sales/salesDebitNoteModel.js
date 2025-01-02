const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {SALES_DEBIT_NOTE: SCHEMA_CONST} = require("../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const salesDebitNoteSchema = new mongoose.Schema(
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
        DNNumber: {
            type: String,
            required: true
        },
        DNDate: {
            type: Date,
            required: true,
            default: new Date()
        },
        salesCategory: {
            type: String,
            required: true
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
        customerName: {
            type: String,
            required: true
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
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                SKU: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "SKUMaster"
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
                }
                // gst: {
                //     type: Number,
                //     set: value => {
                //         if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                //             return parseFloat(value).toFixed(2);
                //         }
                //     },
                //     required: false,
                //     default: 0
                // },
                // igst: {
                //     type: Number,
                //     set: value => {
                //         if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                //             return parseFloat(value).toFixed(2);
                //         }
                //     },
                //     required: false,
                //     default: 0
                // },
                // cgst: {
                //     type: Number,
                //     set: value => {
                //         if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                //             return parseFloat(value).toFixed(2);
                //         }
                //     },
                //     required: false,
                //     default: 0
                // },
                // sgst: {
                //     type: Number,
                //     set: value => {
                //         if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                //             return parseFloat(value).toFixed(2);
                //         }
                //     },
                //     required: false,
                //     default: 0
                // }
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
        DNStatus: {
            type: String,
            required: true,
            enum: ["Awaiting Approval", "Approved", "Rejected", "Report Generated", "Closed"],
            default: "Awaiting Approval"
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

salesDebitNoteSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;

    if (this.isNew) {
        this.DNNumber = await getAndSetAutoIncrementNo({...SCHEMA_CONST.AUTO_INCREMENT_DATA()}, this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
salesDebitNoteSchema.index({DNStatus: -1});
salesDebitNoteSchema.index({DNDate: -1});
salesDebitNoteSchema.plugin(paginatePlugin);
const SalesDebitNote = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, salesDebitNoteSchema);

module.exports = SalesDebitNote;
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
