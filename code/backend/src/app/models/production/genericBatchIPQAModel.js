const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {GENERIC_BATCH_IPQA: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/productionConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const schema = new mongoose.Schema(
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
        processType: {
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
        processUnitId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "ProdProcessConfig"
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

        item: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "ProductionItem"
        },
        IPQALog: {
            prodSource: {
                type: String,
                required: false
            },
            totalProdQty: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            remarks: {
                type: String,
                required: false
            },
            qualityReleasedBy: {
                type: String,
                required: false
            },
            logEntryDetails: [
                {
                    inspectionDate: {
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
                    checkedBy: {
                        type: String,
                        required: false
                    },
                    releaseQty: {
                        type: Number,
                        set: value => setTwoDecimal(value),
                        required: false
                    }
                }
            ]
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

schema.pre("save", async function (next) {
    const {isNew, isModified} = this;

    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
schema.plugin(paginatePlugin);
const genericIPQA = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, schema);

module.exports = genericIPQA;
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
