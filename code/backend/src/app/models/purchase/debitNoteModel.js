const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {DEBIT_NOTE: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/purchaseConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin, reportPaginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");

const debitNoteSchema = new mongoose.Schema(
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
        categoryType: {
            type: String,
            required: false
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Supplier"
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
                    ref: "Items"
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
                    set: value => setTwoDecimal(value),
                    required: false
                },
                returnQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
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
                    set: value => setTwoDecimal(value),
                    required: false
                },
                // from item but editable
                purchaseRate: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                // POQty *  purchaseRate
                lineValue: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                hsn: {
                    type: String,
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
                FIFO: [
                    {
                        GINDate: {
                            type: Date,
                            required: true,
                            default: new Date()
                        },
                        IC: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: true,
                            ref: "InventoryCorrection"
                        },
                        GIN: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: true,
                            ref: "GoodInwardEntry"
                        },
                        MRN: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: true,
                            ref: "MRN"
                        },
                        MRNNo: {
                            type: String,
                            required: false
                        },
                        MRNDate: {
                            type: Date,
                            required: false
                        },
                        expiryDate: {
                            type: Date,
                            required: false
                        },
                        UOM: {
                            type: String,
                            required: false
                        },
                        IRQty: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        rejQty: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        }
                        // receiptQty: {
                        //     type: Number,
                        //     set: value => setTwoDecimal(value),
                        //     required: false
                        // },
                        // diffQty: {
                        //     type: Number,
                        //     set: value => setTwoDecimal(value),
                        //     required: false
                        // },
                        // inventoryQty: {
                        //     type: Number,
                        //     set: value => setTwoDecimal(value),
                        //     required: false
                        // },
                        // WIPQty: {
                        //     type: Number,
                        //     set: value => setTwoDecimal(value),
                        //     required: false
                        // }
                    }
                ]
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
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
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
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

debitNoteSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;

    if (this.isNew) {
        this.DNNumber = await getAndSetAutoIncrementNo({...SCHEMA_CONSTANT.AUTO_INCREMENT_DATA()}, this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
debitNoteSchema.index({DNStatus: -1});
debitNoteSchema.index({DNDate: -1});
debitNoteSchema.plugin(paginatePlugin);
debitNoteSchema.plugin(reportPaginatePlugin);
const DebitNote = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, debitNoteSchema);

module.exports = DebitNote;
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
