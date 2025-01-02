const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {JC_ENTRY: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/productionConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const {OPTIONS} = require("../../helpers/global.options");
const jcEntrySchema = new mongoose.Schema(
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
        jcEntryCode: {
            type: String,
            required: false
        },
        jobCard: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "JobCardCreation"
        },
        jobCardNo: {
            type: String,
            required: false
        },
        SKU: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "referenceModel"
        },
        referenceModel: {
            type: String,
            enum: ["SKUMaster", "NPDMaster"],
            default: "SKUMaster"
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
        totalBatchQuantity: {
            type: Number,
            required: false
        },
        JCEntryDetails: [
            {
                seq: {
                    type: Number,
                    required: false
                },
                process: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "ProcessNameMaster"
                },
                processName: {
                    type: String,
                    required: false
                },
                production: {
                    prodInfo: [
                        {
                            seq: {
                                type: Number,
                                required: false
                            },
                            subProcessName: {
                                type: String,
                                required: false
                            },
                            prodStartDate: {
                                type: Date,
                                required: false
                            },
                            prodEndDate: {
                                type: Date,
                                required: false
                            },
                            operatingStaff: {
                                type: String,
                                required: false
                            },
                            prodStatus: {
                                type: Boolean,
                                required: false
                            }
                        }
                    ],
                    prodRemarks: {
                        type: String,
                        required: false
                    }
                },
                IPQA: {
                    IPQAInfo: [
                        {
                            seq: {
                                type: Number,
                                required: false
                            },
                            subProcessName: {
                                type: String,
                                required: false
                            },
                            inspectedBy: {
                                type: String,
                                required: false
                            },
                            offerDate: {
                                type: Date,
                                required: false
                            },
                            releasedDate: {
                                type: Date,
                                required: false
                            },
                            releaseStatus: {
                                type: String,
                                required: false,
                                // enum: [
                                //     OPTIONS.defaultStatus.RELEASED,
                                //     OPTIONS.defaultStatus.ON_HOLD,
                                //     OPTIONS.defaultStatus.REJECTED
                                // ],
                                default: OPTIONS.defaultStatus.ON_HOLD
                            },
                            IPQAStatus: {
                                type: Boolean,
                                required: false
                            }
                        }
                    ],
                    IPQARemarks: {
                        type: String,
                        required: false
                    }
                },
                processStatus: {
                    type: Boolean,
                    required: false
                }
            }
        ],
        location: {
            type: String,
            required: false
        },
        batchNumber: {
            type: String,
            required: false
        },
        batchOutputQty: {
            type: Number,
            set: value => setTwoDecimal(value),
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
        // Only For Control Panel in company Type
    }
);

jcEntrySchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.jcEntryCode = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
jcEntrySchema.plugin(paginatePlugin);
const jcEntry = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, jcEntrySchema);

module.exports = jcEntry;
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
