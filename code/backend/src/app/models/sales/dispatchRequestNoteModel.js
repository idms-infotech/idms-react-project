const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {OPTIONS} = require("../../helpers/global.options");
const {DISPATCH_REQUEST_NOTE: SCHEMA_CONST} = require("../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const dispatchRequestNoteSchema = new mongoose.Schema(
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
        DRNNumber: {
            type: String,
            required: true
        },
        DRNDate: {
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
        DRNDetails: [
            {
                DRNLineNumber: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: true
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
                currency: {
                    type: String,
                    required: false
                },
                standardRate: {
                    // rate/unit
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                netRate: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
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
                plannedDispatchDt: {
                    type: Date,
                    required: false
                },
                FGINQty: {
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
                SOBalancedQty: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false,
                    default: 0
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
                },
                FGStockDetails: [
                    {
                        FGINId: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: false,
                            ref: "FGIN"
                        },
                        FGBatchNo: {
                            type: String,
                            required: false
                        },
                        aging: {
                            type: String,
                            required: false
                        },
                        FGBatchDate: {
                            type: Date,
                            required: false
                        },
                        FGExpiryDate: {
                            type: Date,
                            required: false
                        },
                        FGINQuantity: {
                            type: Number,
                            required: false
                        },
                        dispatchQty: {
                            type: Number,
                            required: false
                        },
                        isChecked: {
                            type: Boolean,
                            required: false,
                            default: false
                        }
                    }
                ],
                totalDispatchQty: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                tBatchNo: {
                    type: String,
                    required: false
                }
            }
        ],

        DRNStatus: {
            type: String,
            required: true,
            enum: OPTIONS.defaultStatus.getAllDRNStatusArray(),
            default: OPTIONS.defaultStatus.CREATED
        },
        remarks: {
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
            },
            GSTIN: {
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
        billFromLocation: {
            type: String,
            required: false
        },
        modeOfTransport: {
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
        cancellationReason: {
            type: String,
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
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

dispatchRequestNoteSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.DRNNumber = await getAndSetAutoIncrementNo({...SCHEMA_CONST.AUTO_INCREMENT_DATA()}, this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
dispatchRequestNoteSchema.index({DRNStatus: -1});
dispatchRequestNoteSchema.index({DRNDate: -1});
dispatchRequestNoteSchema.plugin(paginatePlugin);
const DispatchRequestNote = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, dispatchRequestNoteSchema);

module.exports = DispatchRequestNote;
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
