const mongoose = require("mongoose");
const Audit = require("../../../controllers/v1/settings/audit/audit");
const {LAMINATION_IPQA: SCHEMA_CONSTANT} = require("../../../mocks/schemasConstant/productionConstant");
const {paginatePlugin} = require("../../plugins/paginatePlugin");
const laminationIPQASchema = new mongoose.Schema(
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
        SKUProcessFlow: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "ProdProcessConfig"
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
        IPQALog: {
            adherenceToProcessStd: {
                type: Boolean,
                required: false
            },
            inProcessInfo: [
                {
                    date: {
                        type: Date,
                        required: false
                    },
                    inProcessNonConformance: {
                        type: String,
                        required: false
                    },
                    inProcessCorrection: {
                        type: String,
                        required: false
                    }
                }
            ],
            remarks: {
                type: String,
                required: false
            },
            IPQAInCharge: {
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

laminationIPQASchema.pre("save", async function (next) {
    const {isNew, isModified} = this;

    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
laminationIPQASchema.plugin(paginatePlugin);
const laminationIPQA = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, laminationIPQASchema);

module.exports = laminationIPQA;
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
