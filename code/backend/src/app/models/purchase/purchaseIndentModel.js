const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {PURCHASE_INDENT: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/purchaseConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin, reportPaginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const purchaseIndentSchema = new mongoose.Schema(
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
        indentOrderNo: {
            type: String,
            required: false
        },
        indentOrderDate: {
            type: Date,
            required: false
        },
        purchaseCategory: {
            type: String,
            required: false
        },
        channelPartner: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "ChannelPartner"
        },
        channelPartnerName: {
            type: String,
            required: false
        },
        indentCategory: {
            type: String,
            required: false
        },
        currency: {
            type: String,
            required: false
        },
        indentDetails: [
            {
                PILineNumber: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                item: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "Items"
                },
                itemCode: {
                    type: String,
                    required: false
                },
                itemName: {
                    type: String,
                    required: false
                },
                itemDescription: {
                    type: String,
                    required: false
                },
                UOM: {
                    type: String,
                    required: false
                },
                stdCostUom1: {
                    type: Number,
                    required: false,
                    default: 0
                },
                stdCostUom2: {
                    type: Number,
                    required: false,
                    default: 0
                },
                primaryUnit: {
                    type: String,
                    required: false
                },
                secondaryUnit: {
                    type: String,
                    required: false
                },
                unitConversion: {
                    type: String,
                    required: false
                },
                currency: {
                    type: String,
                    required: false
                },
                standardRate: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                purchaseRate: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                IOQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                lineValue: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                deliveryCount: {
                    type: Number,
                    required: false
                },
                deliverySchedule: [
                    {
                        scheduleNo: {
                            type: Number,
                            required: false
                        },
                        quantity: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        deliveryDate: {
                            type: Date,
                            required: false
                        }
                    }
                ]
            }
        ],
        netPIValue: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        remarks: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

purchaseIndentSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.intentOrderNo = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
purchaseIndentSchema.plugin(paginatePlugin);
purchaseIndentSchema.plugin(reportPaginatePlugin);
const purchaseIndent = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, purchaseIndentSchema);

module.exports = purchaseIndent;
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
