const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {PROD_PROCESS_FLOW: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/planningConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const prodProcessFlowSchema = new mongoose.Schema(
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
        item: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "ProductionItem"
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
        itemCategory: {
            type: String,
            required: false
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
                source: {
                    type: String,
                    required: false
                }
            }
        ],
        revisionInfo: {
            revisionNo: {
                type: Number,
                required: false
            },
            revisionDate: {
                type: Date,
                required: false
            },
            reasonForRevision: {
                type: String,
                required: false
            },
            revisionProposedBy: {
                type: String,
                required: false
            },
            revisionApprovedBy: {
                type: String,
                required: false
            }
        },
        revisionHistory: []
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

prodProcessFlowSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    this.revisionHistory.push({
        item: this.item,
        prodUnitConfig: this.prodUnitConfig,
        itemCode: this.itemCode,
        itemName: this.itemName,
        itemDescription: this.itemDescription,
        UOM: this.UOM,
        itemCategory: this.itemCategory,
        processDetails: this.processDetails,
        revisionInfo: this.revisionInfo
    });
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
prodProcessFlowSchema.plugin(paginatePlugin);
const prodProcessFlow = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, prodProcessFlowSchema);

module.exports = prodProcessFlow;
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
