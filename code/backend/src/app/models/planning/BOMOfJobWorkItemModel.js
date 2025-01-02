const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {BOM_OF_JOB_WORK_ITEM: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/planningConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const {OPTIONS} = require("../../helpers/global.options");
const JWIItemStdCostRepository = require("./repository/JWIItemStdCostRepository");
const BOMOfJobWorkItemSchema = new mongoose.Schema(
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
        BOMOfJWICode: {
            type: String,
            required: false
        },
        jobWorkItem: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "JobWorkItemMaster"
        },
        jobWorkItemCode: {
            type: String,
            required: false
        },
        jobWorkItemName: {
            type: String,
            required: false
        },
        jobWorkItemDescription: {
            type: String,
            required: false
        },
        UOM: {
            type: String,
            required: false
        },
        partCount: {
            type: Number,
            set: value => setTwoDecimal(value, 3),
            required: false
        },
        BOMOfJobWorkItemInfo: [
            {
                item: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "Items"
                },
                referenceModel: {
                    type: String,
                    enum: ["Items", "ProductionItem", "ChildItem", "ProductionItem"],
                    default: "Items"
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
                    set: value => setTwoDecimal(value),
                    required: false
                },
                qtyPerPartCount: {
                    type: Number,
                    set: value => setTwoDecimal(value, 4),
                    required: false
                },
                wastePercentage: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                totalQtyPerPC: {
                    type: Number,
                    set: value => setTwoDecimal(value, 3),
                    required: false
                },
                unitCost: {
                    type: Number,
                    set: value => setTwoDecimal(value, 3),
                    required: false
                },
                itemCost: {
                    type: Number,
                    set: value => setTwoDecimal(value, 3),
                    required: false
                }
            }
        ],
        totalMaterialCost: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        materialCostForOnePC: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
            default: OPTIONS.defaultStatus.ACTIVE
        },
        revisionInfo: {
            revisionNo: {
                type: String,
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

BOMOfJobWorkItemSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    this.revisionHistory.push({
        jobWorkItem: this.jobWorkItem,
        jobWorkItemCode: this.jobWorkItemCode,
        jobWorkItemName: this.jobWorkItemName,
        jobWorkItemDescription: this.jobWorkItemDescription,
        UOM: this.UOM,
        partCount: this.partCount,
        BOMOfJobWorkItemInfo: this.BOMOfJobWorkItemInfo,
        totalMaterialCost: this.totalMaterialCost,
        materialCostForOnePC: this.materialCostForOnePC,
        status: this.status,
        revisionInfo: this.revisionInfo
    });
    let JWItemObj = await JWIItemStdCostRepository.findOneDoc({jobWorkItem: this.jobWorkItem});
    if (JWItemObj) {
        for (const ele of JWItemObj?.jobWorkerDetails) {
            ele.materialCost = this.materialCostForOnePC;
            ele.totalJWItemCost = this.materialCostForOnePC + ele.conversionCost;
        }
        await JWItemObj.save();
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
BOMOfJobWorkItemSchema.plugin(paginatePlugin);
const BOMOfJobWorkItem = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, BOMOfJobWorkItemSchema);

module.exports = BOMOfJobWorkItem;
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
