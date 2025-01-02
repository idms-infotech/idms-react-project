const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {ADVANCE_SHIPMENT_NOTICE: SCHEMA_CONST} = require("../../mocks/schemasConstant/dispatchConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const advanceShipmentNoticeSchema = new mongoose.Schema(
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
        ASNNumber: {
            type: String,
            required: false
        },
        salesInvoice: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "SalesInvoice"
        },
        salesInvoiceDate: {
            type: Date,
            required: true,
            default: new Date()
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Customer"
        },
        customerName: {
            type: String,
            required: false
        },
        stateOfSupply: {
            type: String,
            required: false
        },
        invoiceValue: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        totalNoOfBoxes: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false,
            default: 0
        },
        totalGrossWeight: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false,
            default: 0
        },
        ASNStatus: {
            type: String,
            required: true,
            enum: ["Created", "Report Generated"],
            default: "Created"
        },
        salesInvoiceDetails: [
            {
                PONumber: {
                    type: String,
                    required: false
                },
                SOId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "SalesOrder"
                },
                batchDate: {
                    type: Date,
                    required: false
                },
                SKU: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "SKUMaster"
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
                unit: {
                    type: String,
                    required: false
                },
                salesInvoiceUnitRate: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: true
                },
                salesInvoiceLineValue: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: true
                },
                HSNCode: {
                    type: String,
                    required: false
                },
                boxNos: {
                    type: String,
                    required: false
                },
                boxDetails: [
                    {
                        boxNo: {
                            type: Number,
                            set: value => {
                                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                                    return parseFloat(value).toFixed(2);
                                }
                            },
                            required: false
                        },
                        qty: {
                            type: Number,
                            set: value => {
                                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                                    return parseFloat(value).toFixed(2);
                                }
                            },
                            required: false
                        },
                        weight: {
                            type: Number,
                            set: value => {
                                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                                    return parseFloat(value).toFixed(2);
                                }
                            },
                            required: false
                        }
                    }
                ]
            }
        ],
        transporter: {
            type: String,
            required: false
        },
        modeOfTransport: {
            type: String,
            required: true
        },
        frightCharge: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        frightTerms: {
            type: String,
            required: false
        },
        deliveryType: {
            type: String,
            required: false
        },
        docketLR: {
            type: String,
            required: false
        },
        docketLRDate: {
            type: Date,
            required: true,
            default: new Date()
        },
        // frightCharge/ Invoice Value * 100
        freight: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

advanceShipmentNoticeSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

advanceShipmentNoticeSchema.plugin(paginatePlugin);

const AdvanceShipmentNotice = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, advanceShipmentNoticeSchema);

module.exports = AdvanceShipmentNotice;
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
