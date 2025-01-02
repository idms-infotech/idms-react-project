const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {PROD_ITEM_STD_COST: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/planningConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const childItemStdCostSchema = new mongoose.Schema(
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
        costSheetNo: {
            type: String,
            required: false
        },
        prodUnitDetails: [
            {
                prodUnitName: {
                    type: String,
                    required: false
                },
                UOM: {
                    type: String,
                    required: false
                },
                currency: {
                    type: String,
                    required: false
                },
                materialCost: {
                    type: Number,
                    set: value => setTwoDecimal(value, 3),
                    required: false,
                    default: 0
                },
                conversionCost: {
                    type: Number,
                    set: value => setTwoDecimal(value, 3),
                    required: false,
                    default: 0
                },
                prodItemCost: {
                    type: Number,
                    set: value => setTwoDecimal(value, 3),
                    required: false,
                    default: 0
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

childItemStdCostSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    this.revisionHistory.push(...this.prodUnitDetails);
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
childItemStdCostSchema.plugin(paginatePlugin);
const ProdItemStdCost = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, childItemStdCostSchema);

module.exports = ProdItemStdCost;
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
