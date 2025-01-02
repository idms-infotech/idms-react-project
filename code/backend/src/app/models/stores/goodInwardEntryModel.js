const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {GOOD_INWARD_ENTRY: SCHEMA_CONST} = require("../../mocks/schemasConstant/storesConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const {PO_RATE_DECIMAL} = require("../../mocks/constantData");
const goodInwardEntrySchema = new mongoose.Schema(
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
        GINNumber: {
            type: String,
            required: false,
            default: 0
        },
        GINDate: {
            type: Date,
            required: true,
            default: new Date()
        },
        sourceDoc: {
            type: String,
            required: false
        },
        MRNNumber: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "refMRN"
        },
        refMRN: {
            type: String,
            enum: ["MRN", "MaterialRevalidation", "DeliveryChallan"],
            default: "MRN"
        },
        docNo: {
            type: String,
            required: false
        },
        MRNDate: {
            type: Date,
            required: false,
            default: new Date()
        },
        purchaseCategory: {
            type: String,
            required: false
        },
        categoryType: {
            type: String,
            required: false
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
        supplierInvoice: {
            type: String,
            required: false
        },
        supplierInvoiceDate: {
            type: Date,
            required: true,
            default: new Date()
        },
        currency: {
            type: String,
            required: true
        },
        GINStatus: {
            type: String,
            required: false,
            default: "Created"
        },
        GINDetails: [
            {
                GINLineNumber: {
                    type: Number,
                    required: false
                },
                MRNLineNumber: {
                    type: Number,
                    required: false
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
                UOM: {
                    type: String,
                    required: true
                },
                item: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "Items"
                },
                referenceModel: {
                    type: String,
                    enum: ["Items", "ProductionItem", "ChildItem"],
                    default: "Items"
                },
                itemType: {
                    type: String,
                    required: false
                },
                // itemSubCategory: {
                //     type: String,
                //     required: false,
                //     default: "General"
                // },
                GINQty: {
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
                purchaseRateUSD: {
                    type: Number,
                    set: value => setTwoDecimal(value, PO_RATE_DECIMAL),
                    required: false
                },
                purchaseRatINR: {
                    type: Number,
                    set: value => setTwoDecimal(value, PO_RATE_DECIMAL),
                    required: false
                },
                lineValueINR: {
                    type: Number,
                    set: value => setTwoDecimal(value, PO_RATE_DECIMAL),
                    required: false
                },
                releasedQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                rejectedQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                batchDate: {
                    type: Date,
                    required: false
                },
                MRNNumber: {
                    type: String,
                    required: false
                },
                inventoryZoneId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "InvZoneConfig"
                },
                invZoneName: {
                    type: String,
                    required: false
                },
                deliveryLocation: {
                    type: String,
                    required: false
                },
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
                }
            }
        ],
        deliveryLocation: {
            type: String,
            required: false
        },
        remarks: {
            type: String,
            required: false
        }
        // storageLocationMapping: {
        //     subLocation: {
        //         type: String,
        //         required: false
        //     },
        //     rowNo: {
        //         type: String,
        //         required: false
        //     },
        //     rackNo: {
        //         type: String,
        //         required: false
        //     },
        //     binNo: {
        //         type: String,
        //         required: false
        //     },
        //     otherId: {
        //         type: String,
        //         required: false
        //     }
        // }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
goodInwardEntrySchema.pre("save", async function (next) {
    const {isNew, isModified} = this;

    if (this.isNew) {
        this.GINNumber =
            this.GINNumber != "0000000"
                ? await getAndSetAutoIncrementNo({...SCHEMA_CONST.AUTO_INCREMENT_DATA()}, this.company, true)
                : 0;
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);

    next();
});
goodInwardEntrySchema.index({GINStatus: -1});
goodInwardEntrySchema.index({GINDate: -1});
goodInwardEntrySchema.index({deliveryLocation: -1});
goodInwardEntrySchema.plugin(paginatePlugin);
const GoodInwardEntry = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, goodInwardEntrySchema);

module.exports = GoodInwardEntry;
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
