const mongoose = require("mongoose");
const Audit = require("../../../controllers/v1/settings/audit/audit");
const {BC_INK_MIXING: SCHEMA_CONSTANT} = require("../../../mocks/schemasConstant/productionConstant");
const {paginatePlugin} = require("../../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../../helpers/utility");
const BCInkMixingSchema = new mongoose.Schema(
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
        batchCard: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "BatchCard"
        },
        prodProcessConfig: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "ProdProcessConfig"
        },
        batchCardNo: {
            type: String,
            required: false
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
        item: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "ProductionItem"
        },
        batchTotal: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        MF: {
            type: Number,
            required: false
        },
        batchQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        logDetails: [
            {
                SN: {
                    type: Number,
                    required: false
                },
                reference: {
                    type: mongoose.Schema.Types.ObjectId,
                    refPath: "referenceModel"
                },
                referenceModel: {
                    enum: ["ProductionItem", "Items", "InkMaster"],
                    type: String
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
                MBQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                MF: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                qty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                newBatch: [
                    {
                        batchCardNo: {
                            type: String,
                            required: false
                        },
                        batchCardDate: {
                            type: Date,
                            required: false
                        },
                        UOM: {
                            type: String,
                            required: false
                        },
                        SOH: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        expiryDate: {
                            type: Date,
                            required: false
                        },
                        usage: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        }
                    }
                ]
            }
        ],
        prodDetails: {
            prodDate: {
                type: Date,
                required: false
            },
            prodShift: {
                type: String,
                required: false
            },
            prodRemarks: {
                type: String,
                required: false
            },
            prodInCharge: {
                type: String,
                required: false
            }
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

BCInkMixingSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
BCInkMixingSchema.plugin(paginatePlugin);
const BCInkMixing = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, BCInkMixingSchema);

module.exports = BCInkMixing;
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
