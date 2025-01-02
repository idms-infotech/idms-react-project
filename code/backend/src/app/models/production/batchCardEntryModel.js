const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {BATCH_CARD_ENTRY: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/productionConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {setTwoDecimal} = require("../../helpers/utility");
const { OPTIONS } = require("../../helpers/global.options");
const batchCardEntrySchema = new mongoose.Schema(
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
        BCEntryNo: {
            type: String,
            required: false
        },
        batchCardNo: {
            type: String,
            required: false
        },
        batchCard: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "BatchCard"
        },
        batchCardDate: {
            type: Date,
            required: false
        },
        productionUnit: {
            type: String,
            required: false
        },
        prodUnitConfig: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "ProductionUnitConfig"
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
        batchQty: {
            type: Number,
            required: false,
            set: value => setTwoDecimal(value)
        },
        inventoryZone: {
            type: String,
            required: false
        },
        invZone: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "InvZoneConfig"
        },
        processDetails: [
            {
                srNo: {
                    type: Number,
                    required: false
                },
                processUnitId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "ProdProcessConfig"
                },
                processName: {
                    type: String,
                    required: false
                },
                processOriginalName: {
                    type: String,
                    required: false
                },
                qualityOriginalName: {
                    type: String,
                    required: false
                },
                source: {
                    type: String,
                    required: false
                },
                processStatus: {
                    type: Boolean,
                    required: false
                }
            }
        ],
        generateReport: {
            batchInputQty: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            batchOutputQty: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            batchRejQty: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            batchCardClosureDate: {
                type: Date,
                required: false
            },
            location: {
                type: String,
                required: false
            },
            checkoutStatus: {
                type: String,
                required: false,
                default: OPTIONS.defaultStatus.IN_PROGRESS
            },
            qualityRemarks: {
                type: String,
                required: false
            },
            qualityInCharge: {
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

batchCardEntrySchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.BCEntryNo = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
batchCardEntrySchema.plugin(paginatePlugin);
const BatchCardEntry = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, batchCardEntrySchema);

module.exports = BatchCardEntry;
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
