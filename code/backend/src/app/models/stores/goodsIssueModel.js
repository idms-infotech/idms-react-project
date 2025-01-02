const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {GOOD_ISSUE: SCHEMA_CONST} = require("../../mocks/schemasConstant/storesConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const goodsIssueSchema = new mongoose.Schema(
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
        GINumber: {
            type: String,
            required: true
        },
        GRNumber: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "GoodsRequisition"
        },
        deliveryLocation: {
            type: String,
            required: false
        },
        department: {
            type: String,
            required: false
        },
        GIDate: {
            type: Date,
            required: true,
            default: new Date()
        },
        GRDate: {
            type: Date,
            required: false,
            default: new Date()
        },
        GIStatus: {
            type: String,
            required: true,
            enum: [
                "Opened",
                "Awaiting Acknowledgement",
                "Rejected",
                "Acknowledged",
                "Discrepancy Reported",
                "Discrepancy Resolved"
            ]
        },
        remarks: {
            type: String,
            required: false
        },
        rejectionRemarks: {
            type: String,
            required: false
        },
        actionBy: {
            type: String,
            required: false
        },
        GIDetails: [
            {
                GILineNumber: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false,
                    default: 1
                },
                GRLineNumber: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false,
                    default: 1
                },
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
                item: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "Items"
                },
                UOM: {
                    type: String,
                    required: false
                },
                conversionOfUnits: {
                    type: String,
                    required: false
                },
                IRQty: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                GRQty: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                GIQty: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                receiptQty: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                diffQty: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                inventoryQty: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                WIPQty: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                GILineStatus: {
                    type: String,
                    required: true,
                    default: "Opened"
                }
            }
        ]
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
goodsIssueSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;

    if (this.isNew) {
        this.GINumber = await getAndSetAutoIncrementNo({...SCHEMA_CONST.AUTO_INCREMENT_DATA()}, this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);

    next();
});
goodsIssueSchema.index({GIDate: -1});
goodsIssueSchema.index({GIStatus: -1});
goodsIssueSchema.plugin(paginatePlugin);
const GoodsIssue = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, goodsIssueSchema);

module.exports = GoodsIssue;
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
