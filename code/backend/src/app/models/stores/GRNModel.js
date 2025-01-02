const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {GOODS_RECEIPT_NOTE: SCHEMA_CONST} = require("../../mocks/schemasConstant/storesConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const {OPTIONS} = require("../../helpers/global.options");
const {PO_RATE_DECIMAL} = require("../../mocks/constantData");
const GRNSchema = new mongoose.Schema(
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
        GRNNumber: {
            type: String,
            required: true
        },
        GRNDate: {
            type: Date,
            required: true,
            default: new Date()
        },
        POId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "PurchaseOrder"
        },
        PONumber: {
            type: String,
            required: false,
            default: "-"
        },
        PODate: {
            type: Date,
            required: false,
            default: new Date()
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            refPath: "referenceModel"
        },
        referenceModel: {
            type: String,
            enum: ["Customer", "Supplier"],
            default: "Supplier"
        },
        supplierName: {
            type: String,
            required: false
        },
        supplierInvoiceRef: {
            type: String,
            required: true
        },
        supplierInvoiceRefDate: {
            type: Date,
            required: true
        },
        currency: {
            type: String,
            required: false
        },
        GRNStatus: {
            type: String,
            required: true,
            // enum: [
            //     "Awaiting Approval",
            //     "Approved",
            //     "Rejected",
            //     "Report Generated",
            //     "GRN Partial Created",
            //     "GRN Created",
            //     "Closed",
            // ],
            enum: OPTIONS.defaultStatus.getAllGRNStatusAsArray(),
            default: OPTIONS.defaultStatus.AWAITING_APPROVAL
        },
        remarks: {
            type: String,
            required: false
        },
        goodsDeliveryDate: {
            type: Date,
            required: false,
            default: new Date()
        },
        transporterName: {
            type: String,
            required: false
        },
        AWB_LR_BR: {
            type: String,
            required: false
        },
        freightChargesPaid: {
            type: Number,
            set: value => setTwoDecimal(value, PO_RATE_DECIMAL),
            required: false
        },
        otherChargesPaid: {
            type: Number,
            set: value => setTwoDecimal(value, PO_RATE_DECIMAL),
            required: false
        },
        deliveryLocation: {
            type: String,
            required: false
        },
        GRNDetails: [
            {
                GRNLineNumber: {
                    type: Number,
                    required: false
                },
                POLineNumber: {
                    type: Number,
                    required: false
                },
                item: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "Items"
                },
                itemType: {
                    type: String,
                    required: false
                },
                UOM: {
                    type: String,
                    required: true
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
                conversionOfUnits: {
                    type: String,
                    required: false
                },
                POQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                GRNQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                standardRate: {
                    type: Number,
                    set: value => setTwoDecimal(value, PO_RATE_DECIMAL),
                    required: false
                },
                purchaseRate: {
                    type: Number,
                    set: value => setTwoDecimal(value, PO_RATE_DECIMAL),
                    required: false
                },
                invoiceRate: {
                    type: Number,
                    set: value => setTwoDecimal(value, PO_RATE_DECIMAL),
                    required: false
                },
                // receivedQty: {
                //   type: Number,
                //  set: value => {
                //     if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                //         return parseFloat(value).toFixed(2);
                //     }
                // },
                //   required: false,
                // },
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
                rejectedQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                canceledQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                balancedMRNQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                previousMRNQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                canceledReason: {
                    type: String,
                    required: false
                },
                lineRemarks: {
                    type: String,
                    required: false
                },
                QCLevels: {
                    type: String,
                    required: false
                },

                batchDate: {
                    type: Date,
                    required: false
                }
            }
        ],
        isTaxInvoice: {
            type: Boolean,
            required: false
        },
        isEWayBill: {
            type: Boolean,
            required: false
        },
        isDeliveryChallan: {
            type: Boolean,
            required: false
        },
        isPackingList: {
            type: Boolean,
            required: false
        },
        isCOATC: {
            type: Boolean,
            required: false
        },
        storageLocationMapping: {
            subLocation: {
                type: String,
                required: false
            },
            rowNo: {
                type: String,
                required: false
            },
            rackNo: {
                type: String,
                required: false
            },
            binNo: {
                type: String,
                required: false
            },
            otherId: {
                type: String,
                required: false
            }
        },
        cancellationReason: {
            type: String,
            required: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

GRNSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.GRNNumber =
            this.GRNNumber != "0000000"
                ? await getAndSetAutoIncrementNo({...SCHEMA_CONST.AUTO_INCREMENT_DATA()}, this.company, true)
                : 0;
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
GRNSchema.index({GRNStatus: -1});
GRNSchema.index({GRNDate: -1});
GRNSchema.plugin(paginatePlugin);
const GRN = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, GRNSchema);

module.exports = GRN;
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
