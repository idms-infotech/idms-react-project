const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {BOM_OF_KIT: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/planningConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const { setTwoDecimal } = require("../../helpers/utility");
const BOMOfKITSchema = new mongoose.Schema(
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
        BOMNo: {
            type: String,
            required: false
        },
        KIT: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "KITMaster"
        },
        KITNo: {
            type: String,
            required: false
        },
        KITName: {
            type: String,
            required: false
        },
        KITDescription: {
            type: String,
            required: false
        },
        UOM: {
            type: String,
            required: false
        },
        partCount: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        totalBatchQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        totalMaterialCost: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        materialCostPerUnit: {
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
        BOMStatus: {
            type: String,
            required: false,
            enum: [OPTIONS.defaultStatus.CREATED, OPTIONS.defaultStatus.APPROVED],
            default: OPTIONS.defaultStatus.CREATED
        },
        BOMOfKITDetails: [
            {
                seq: {
                    type: Number,
                    required: false
                },
                reference: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    refPath: "referenceModel"
                },
                referenceModel: {
                    type: String,
                    required: true,
                    enum: ["SKUMaster"]
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
                qtyPerPC: {
                    type: Number,
                    set: value => setTwoDecimal(value, 5),
                    required: false
                },
                wastePercentage: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                totalQtyPerPC: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                ratePerUnit: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                itemCost: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                }
            }
        ],
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

BOMOfKITSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    this.revisionHistory.push({
        BOMNo: this.BOMNo,
        KIT: this.KIT,
        KITNo: this.KITNo,
        KITName: this.KITName,
        KITDescription: this.KITDescription,
        UOM: this.UOM,
        partCount: this.partCount,
        totalMaterialCost: this.totalMaterialCost,
        materialCostPerUnit: this.materialCostPerUnit,
        status: this.status,
        BOMOfKITDetails: this.BOMOfKITDetails,
        revisionInfo: this.revisionInfo
    });
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
BOMOfKITSchema.plugin(paginatePlugin);
const BOMOfKIT = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, BOMOfKITSchema);

module.exports = BOMOfKIT;
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
