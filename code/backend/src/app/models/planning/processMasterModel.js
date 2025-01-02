const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {PROCESS_MASTER: SCHEMA_CONST} = require("../../mocks/schemasConstant/planningConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const {OPTIONS} = require("../../helpers/global.options");
const processMasterSchema = new mongoose.Schema(
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
        processId: {
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
        processName: {
            type: String,
            required: false
        },
        sourceOfManufacturing: {
            type: String,
            required: false
        },
        primaryAssetAllocation: {
            type: String,
            required: false
        },
        unitProcessOutput: {
            type: String,
            required: false
        },
        standardOutputPerHr: {
            type: Number,
            required: false
        },
        allocationOfSkilledLabour: {
            type: Number,
            required: false
        },
        skilledRatePerHr: {
            type: Number,
            required: false
        },
        allocationOfSemiSkilledLabour: {
            type: Number,
            required: false
        },
        semiSkilledRatePerHr: {
            type: Number,
            required: false
        },
        allocationOfUnSkilledLabour: {
            type: Number,
            required: false
        },
        unSkilledRatePerHr: {
            type: Number,
            required: false
        },
        totalLabourHeadCount: {
            type: Number,
            required: false
        },
        totalRatePerHr: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        assetAllocationDetails: [
            {
                asset: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "Asset"
                },
                assetCode: {
                    type: String,
                    required: false
                },
                assetName: {
                    type: String,
                    required: false
                },
                assetDescription: {
                    type: String,
                    required: false
                },
                location: {
                    type: String,
                    required: false
                },
                totalAssetCostPerHr: {
                    type: Number,
                    required: false
                },
                isSelect: {
                    type: Boolean,
                    required: false,
                    default: false
                }
            }
        ],
        totalAllocatedAssetCostPerHr: {
            type: Number,
            required: false
        },
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
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

processMasterSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.processId = await getAndSetAutoIncrementNo({...SCHEMA_CONST.AUTO_INCREMENT_DATA()}, this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

processMasterSchema.plugin(paginatePlugin);
const ProcessMaster = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, processMasterSchema);

module.exports = ProcessMaster;
const auditTrail = async (master, modifiedPaths, isNew, isModified) => {
    const {createdBy, updatedBy, company} = master;
    const auditTrail = {
        company: company,
        oldData: JSON.stringify(await master.constructor.findById(master._id)),
        data: JSON.stringify(master),
        user: isNew ? createdBy : updatedBy, // Replace with the actual current user's name
        action: isNew ? SCHEMA_CONST.ADDED_ACTION : SCHEMA_CONST.UPDATED_ACTION,
        fieldsModified: modifiedPaths.toString()
    };
    await Audit.auditModule(auditTrail);
};
