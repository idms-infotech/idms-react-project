const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {PROCESS_SPEC_BY_PROD_CATEGORY: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/financeConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const processSpecByProdCategorySchema = new mongoose.Schema(
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
        productCategory: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "ProductCategory"
        },
        productNumber: {
            type: String,
            required: false
        },
        productCode: {
            type: String,
            required: false
        },
        displayProductCategoryName: {
            type: String,
            required: false
        },
        application: {
            type: String,
            required: false
        },
        processInfo: [
            {
                seq: {
                    type: Number,
                    required: false
                },
                process: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "ProcessMaster"
                },
                processId: {
                    type: String,
                    required: false
                },
                processName: {
                    type: String,
                    required: false
                },
                unitProcessOutput: {
                    type: String,
                    required: false
                },
                allocationOfSkilledLabour: {
                    type: Number,
                    required: false
                },
                allocationOfSemiSkilledLabour: {
                    type: Number,
                    required: false
                },
                allocationOfUnSkilledLabour: {
                    type: Number,
                    required: false
                },
                totalLabourHeadCount: {
                    type: Number,
                    required: false
                },
                labourRatePerHr: {
                    type: Number,
                    required: false
                },
                totalAllocatedAssetCostPerHr: {
                    type: Number,
                    required: false
                }
            }
        ],
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

processSpecByProdCategorySchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
processSpecByProdCategorySchema.plugin(paginatePlugin);
const processSpecByProdCategory = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, processSpecByProdCategorySchema);

module.exports = processSpecByProdCategory;
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
