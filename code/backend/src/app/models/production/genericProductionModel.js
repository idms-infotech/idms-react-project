const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {GENERIC_PRODUCTION: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/productionConstant");
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
        jobCard: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "JobCardCreation"
        },
        SKUProcessFlow: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "SKUProcessFlow"
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
        prodLog: {
            prodSource: {
                type: String,
                required: false
            },
            cumulativeCount: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            remarks: {
                type: String,
                required: false
            },
            prodAuthorizedBy: {
                type: String,
                required: false
            },
            logEntryDetails: [
                {
                    prodDate: {
                        type: Date,
                        required: false
                    },
                    prodShift: {
                        type: String,
                        required: false
                    },
                    operatingStaff: {
                        type: String,
                        required: false
                    },
                    prodQty: {
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
const genericProduction = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, schema);

module.exports = genericProduction;
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
