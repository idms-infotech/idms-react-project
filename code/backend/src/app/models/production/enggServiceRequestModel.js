const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {ENGG_SERVICE_REQUEST: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/productionConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin, reportPaginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const {setTwoDecimal} = require("../../helpers/utility");
const enggServiceRequestSchema = new mongoose.Schema(
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
        ESRNo: {
            type: String,
            required: false
        },
        ESRDate: {
            type: Date,
            required: false
        },
        serviceType: {
            type: String,
            required: false
        },
        priority: {
            type: String,
            required: false,
            enum: ["Low", "Medium", "High"]
        },
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
        breakdownDate: {
            type: Date,
            required: false
        },
        breakdownTime: {
            type: String,
            required: false
        },
        issueDescription: {
            type: String,
            required: false
        },
        detailDescription: {
            type: String,
            required: false
        },
        serviceRequiredDate: {
            type: Date,
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: [
                OPTIONS.defaultStatus.CREATED,
                OPTIONS.defaultStatus.IN_PROGRESS,
                OPTIONS.defaultStatus.ISSUE_RESOLVED,
                OPTIONS.defaultStatus.APPROVED
            ]
        },
        // maintenance Keys
        maintenanceStatus: {
            type: String,
            required: false,
            enum: [
                OPTIONS.defaultStatus.IN_PROGRESS,
                OPTIONS.defaultStatus.WAITING_FOR_PARTS,
                OPTIONS.defaultStatus.ISSUE_FIXED,
                OPTIONS.defaultStatus.ISSUE_RESOLVED
            ]
        },
        nameOfServEngg: {
            type: String,
            required: false
        },
        issueCategory: {
            type: String,
            required: false
        },
        assetRestorationDate: {
            type: Date,
            required: false
        },
        assetRestorationTime: {
            type: String,
            required: false
        },
        totalDownTime: {
            type: String,
            required: false
        },
        servEnggRemarks: {
            causeOfBreakDown: {
                type: String,
                required: false
            },
            maintenanceActionTaken: {
                type: String,
                required: false
            },
            partsReplaced: {
                type: String,
                required: false
            }
        },
        labourTimeAllocation: {
            totSkillLabourHrs: {
                type: String,
                required: false
            },
            totSemiSkillLabourHrs: {
                type: String,
                required: false
            },
            totUnSkillLabourHrs: {
                type: String,
                required: false
            },
            totLabourHrs: {
                type: String,
                required: false
            },
            dateWiseInfo: [
                {
                    dateOfWork: {
                        type: Date,
                        required: false
                    },
                    skillLabourHrs: {
                        type: String,
                        required: false
                    },
                    semiSkillLabourHrs: {
                        type: String,
                        required: false
                    },
                    unSkillLabourHrs: {
                        type: String,
                        required: false
                    },
                    labourHrs: {
                        type: String,
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

enggServiceRequestSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.ESRNo = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
enggServiceRequestSchema.plugin(paginatePlugin);
enggServiceRequestSchema.plugin(reportPaginatePlugin);
const EnggServiceRequest = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, enggServiceRequestSchema);

module.exports = EnggServiceRequest;
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
