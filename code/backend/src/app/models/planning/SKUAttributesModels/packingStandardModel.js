const mongoose = require("mongoose");
const Audit = require("../../../controllers/v1/settings/audit/audit");
const {PACKING_STANDARD: SCHEMA_CONSTANT} = require("../../../mocks/schemasConstant/planningConstant");
const {paginatePlugin} = require("../../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../../helpers/utility");
const {OPTIONS} = require("../../../helpers/global.options");
const packingStandardSchema = new mongoose.Schema(
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
        packCount: {
            type: Number,
            required: false,
            set: value => setTwoDecimal(value)
        },
        masterCarterWeight: {
            type: Number,
            required: false,
            set: value => setTwoDecimal(value)
        },
        details: [
            {
                seq: {
                    type: String,
                    required: false
                },
                item: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    refPath: "referenceModel"
                },
                referenceModel: {
                    enum: ["Items"],
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
                qtyPerPC: {
                    type: String,
                    required: false,
                    set: value => setTwoDecimal(value)
                },
                remarks: {
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
        revisionHistory: [],
        status: {
            type: String,
            required: false,
            enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
            default: OPTIONS.defaultStatus.ACTIVE
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

packingStandardSchema.pre("save", async function (next) {
    this.revisionHistory.push({
        SKU: this.SKU,
        SKUNo: this.SKUNo,
        SKUName: this.SKUName,
        SKUDescription: this.SKUDescription,
        UOM: this.UOM,
        packCount: this.packCount,
        status: this.status,
        masterCarterWeight: this.masterCarterWeight,
        details: this.details,
        revisionInfo: this.revisionInfo
    });
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
packingStandardSchema.plugin(paginatePlugin);
const PackingStandard = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, packingStandardSchema);

module.exports = PackingStandard;
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
