const mongoose = require("mongoose");
const Audit = require("../../../controllers/v1/settings/audit/audit");
const {BC_PROD_LOG: SCHEMA_CONSTANT} = require("../../../mocks/schemasConstant/productionConstant");
const {paginatePlugin} = require("../../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../../helpers/utility");
const BCProdLogSchema = new mongoose.Schema(
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
        item: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "ProductionItem"
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
        batchQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },

        prodDetails: [
            {
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
                MRQ: {
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
        prodLog: {
            details: [
                {
                    prodDate: {
                        type: Date,
                        required: false
                    },
                    shift: {
                        type: String,
                        required: false
                    },
                    UOM: {
                        type: String,
                        required: false
                    },
                    prodQty: {
                        type: Number,
                        required: false,
                        set: value => setTwoDecimal(value)
                    },
                    shiftInCharge: {
                        type: String,
                        required: false
                    }
                }
            ],
            totalProdQty: {
                type: Number,
                required: false,
                set: value => setTwoDecimal(value)
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

BCProdLogSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
BCProdLogSchema.plugin(paginatePlugin);
const BCProdLog = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, BCProdLogSchema);

module.exports = BCProdLog;
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
