const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {STOCK_PREPARATION: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/planningConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const stockPreparationSchema = new mongoose.Schema(
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
        jobCard: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "JobCardCreation"
        },
        jobCardNo: {
            type: String,
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
        SKUBatchQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        stockPreparationDetails: [
            {
                item: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
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
                primaryToSecondaryConversion: {
                    type: Number,
                    set: value => setTwoDecimal(value, 3),
                    required: false
                },
                secondaryToPrimaryConversion: {
                    type: Number,
                    set: value => setTwoDecimal(value)
                },
                MRPQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                logEntry: {
                    prodSource: {
                        type: String,
                        required: false
                    },
                    prodDate: {
                        type: Date,
                        required: false
                    },
                    prodShift: {
                        type: String,
                        required: false
                    },
                    operatingStaff: {
                        type: String,
                        required: false
                    },
                    remarks: {
                        type: String,
                        required: false
                    },
                    authorizedBy: {
                        type: String,
                        required: false
                    }
                },
                GTQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                addOnGTQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                isSaved: {
                    type: Boolean,
                    required: false
                },
                inventoryHistory: [
                    {
                        inventory: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: true,
                            ref: "InventoryCorrection"
                        },
                        transferQty: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        }
                    }
                ]
            }
        ]
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

stockPreparationSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
stockPreparationSchema.plugin(paginatePlugin);
const stockPreparation = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, stockPreparationSchema);

module.exports = stockPreparation;
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
