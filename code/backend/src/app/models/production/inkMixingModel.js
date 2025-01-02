const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {INK_MIXING: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/productionConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const inkMixingSchema = new mongoose.Schema(
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

        inkMixingCode: {
            type: String,
            required: false
        },
        jobCard: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "JobCardCreation"
        },

        jobCardNo: {
            type: String,
            required: false
        },
        inkMixingDetails: [
            {
                ink: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "InkMaster"
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
                MRPQty: {
                    // bom of sku of ink
                    type: Number,
                    required: false
                },
                openQty: {
                    // from inventory quantity
                    type: Number,
                    required: false
                },
                batchQty: {
                    type: Number,
                    required: false
                },
                perUnitQty: {
                    type: Number,
                    required: false
                },
                inkDetails: [
                    {
                        item: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: false,
                            refPath: "referenceModel"
                        },
                        referenceModel: {
                            type: String,
                            enum: ["Items", "InkMaster"]
                        },
                        seq: {
                            type: Number,
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
                        qty: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        gramUOM: {
                            type: String,
                            required: false
                        },
                        gramQty: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        }
                    }
                ],
                remarks: {
                    manufacturingDate: {
                        type: Date,
                        required: false
                    },
                    shift: {
                        type: String,
                        required: false
                    },
                    logBookRef: {
                        type: String,
                        required: false
                    },
                    preparedBy: {
                        type: String,
                        required: false
                    },
                    checkedBy: {
                        type: String,
                        required: false
                    }
                },
                labValues: {
                    L: {
                        type: Number,
                        required: false
                    },
                    a: {
                        type: Number,
                        required: false
                    },
                    b: {
                        type: Number,
                        required: false
                    }
                }
            }
        ]
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

inkMixingSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.inkMixingCode = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
inkMixingSchema.plugin(paginatePlugin);
const inkMixing = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, inkMixingSchema);

module.exports = inkMixing;
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
