const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {SERVICE_PURCHASE_ORDER: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/purchaseConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin, reportPaginatePlugin} = require("../plugins/paginatePlugin");
const servicePurchaseOrderSchema = new mongoose.Schema(
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
        SPONumber: {
            type: String,
            required: true
        },
        SPODate: {
            type: Date,
            required: true,
            default: new Date()
        },
        // enter
        orderReference: {
            type: String,
            required: false
        },
        // from ServiceMaster
        currency: {
            type: String,
            required: true
        },
        deliveryLocation: {
            type: String,
            required: false,
            default: ""
        },
        deliveryDate: {
            type: Date,
            required: true,
            default: new Date()
        },
        SPODetails: [
            {
                // sr no
                SPOLineNumber: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                serviceMaster: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "ServiceMaster"
                },
                serviceCode: {
                    type: String,
                    required: true
                },
                serviceDescription: {
                    type: String,
                    required: true
                },

                // from ServiceMaster
                // UOM: {
                //   type: String,
                //   required: false,
                // },
                // from ServiceMaster
                // unitConversion: {
                //   type: String,
                //   required: false,
                // },
                // from ServiceMaster
                // primaryUnit: {
                //   type: String,
                //   required: false,
                // },
                // enter
                SPOQty: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                // from ServiceMaster
                standardRate: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                // from ServiceMaster but editable
                purchaseRate: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                // SPOQty *  purchaseRate
                lineValue: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                // (SPOQty *  standardRate) - (SPOQty *  purchaseRate)
                linePPV: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                // enter
                deliveryDate: {
                    type: Date,
                    required: false
                },
                // SPOLineTargetDate: {
                //   type: Date,
                //   required: false,
                // },

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
                },
                lineRemarks: {
                    type: String,
                    required: false,
                    default: "-"
                },
                // from grn
                receivedQty: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
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
                balancedQty: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false,
                    default: 0
                },
                previousGRNQty: {
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
                    required: false,
                    default: ""
                },
                markedForAlternateSupplier: {
                    type: String,
                    required: true,
                    default: "No"
                }
            }
        ],
        remarks: {
            type: String,
            required: false,
            default: ""
        },
        SPORemarks: {
            type: String,
            required: false
        },
        // sum of line value
        netSPOValue: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false,
            default: 0
        },
        // sum of line PPv
        totalPPV: {
            type: String,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false,
            default: 0
        },
        isActive: {
            type: String,
            required: true,
            enum: ["Y", "N"],
            default: "Y"
        },
        SPOStatus: {
            type: String,
            required: true,
            enum: [
                "Awaiting Approval",
                "Approved",
                "GRN Partial Created",
                "GRN Created",
                "Closed",
                "Rejected",
                "Report Generated"
            ],
            default: "Awaiting Approval"
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

servicePurchaseOrderSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;

    if (this.isNew) {
        this.SPONumber = await getAndSetAutoIncrementNo({...SCHEMA_CONSTANT.AUTO_INCREMENT_DATA()}, this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
servicePurchaseOrderSchema.index({SPOStatus: -1});
servicePurchaseOrderSchema.index({SPODate: -1});
servicePurchaseOrderSchema.plugin(paginatePlugin);
servicePurchaseOrderSchema.plugin(reportPaginatePlugin);
const ServicePurchaseOrder = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, servicePurchaseOrderSchema);

module.exports = ServicePurchaseOrder;
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
