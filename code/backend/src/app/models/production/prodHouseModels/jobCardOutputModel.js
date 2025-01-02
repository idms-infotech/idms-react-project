const mongoose = require("mongoose");
const Audit = require("../../../controllers/v1/settings/audit/audit");
const {JOB_CARD_OUTPUT: SCHEMA_CONSTANT} = require("../../../mocks/schemasConstant/productionConstant");
const {getAndSetAutoIncrementNo} = require("../../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../../helpers/utility");
const jobCardOutputSchema = new mongoose.Schema(
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
        jobCardOutputNo: {
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
            ref: "ProdProcessConfig"
        },
        jobCardNo: {
            type: String,
            required: false
        },
        manufacturingDate: {
            type: Date,
            required: false,
            default: new Date()
        },
        batchNumber: {
            type: String,
            required: false
        },
        SKU: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
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
        productCategory: {
            type: String,
            required: false
        },
        batchDate: {
            type: Date,
            required: false
        },
        UOM: {
            type: String,
            required: false
        },
        batchInputQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        batchOutputQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        outputDetails: [
            {
                srNo: {
                    type: Number,
                    required: false
                },
                inspectionDate: {
                    type: Date,
                    required: false
                },
                UOM: {
                    type: String,
                    required: false
                },
                outputQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                inspectedBy: {
                    type: String,
                    required: false
                },
                QCApprovedBy: {
                    type: String,
                    required: false
                }
            }
        ],
        cumulativeCount: {
            type: Number,
            required: false
        },
        location: {
            type: String,
            required: false
        },
        approvedDate: {
            type: Date,
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: ["In-Process", "Mark As Completed", "Approved", "Report Generated"],
            default: "In-Process"
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

jobCardOutputSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.jobCardOutputNo = await getAndSetAutoIncrementNo(
            SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(),
            this.company,
            true
        );
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
jobCardOutputSchema.plugin(paginatePlugin);
const jobCardOutput = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, jobCardOutputSchema);

module.exports = jobCardOutput;
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
