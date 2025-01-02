const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {SAMPLE_JC_ENTRY: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/businessLeadsConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const {setTwoDecimal} = require("../../helpers/utility");
const sampleJCEntrySchema = new mongoose.Schema(
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
            ref: "SampleJCCreation"
        },
        jobCardNo: {
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
                    ref: "ProcessMaster"
                },
                processName: {
                    type: String,
                    required: false
                },
                machineInfo: [
                    {
                        machine: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: false,
                            ref: "Asset"
                        },
                        machineName: {
                            type: String,
                            required: false
                        }
                    }
                ],
                machine: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "Asset"
                },
                machineName: {
                    type: String,
                    required: false
                },
                UOM: {
                    type: String,
                    required: false
                },
                production: {
                    prodSource: {
                        type: String,
                        required: false
                    },
                    cumulativeCount: {
                        type: Number,
                        set: value => setTwoDecimal(value),
                        required: false
                    },
                    info: [
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
                    ],
                    remarks: {
                        type: String,
                        required: false
                    },
                    prodAuthorizedBy: {
                        type: String,
                        required: false
                    }
                },
                prodQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                IPQA: {
                    prodSource: {
                        type: String,
                        required: false
                    },
                    cumulativeCount: {
                        type: Number,
                        set: value => setTwoDecimal(value),
                        required: false
                    },
                    info: [
                        {
                            inspectionDate: {
                                type: Date,
                                required: false
                            },
                            shift: {
                                type: String,
                                required: false
                            },
                            inspectionStaff: {
                                type: String,
                                required: false
                            },
                            releaseQty: {
                                type: Number,
                                set: value => setTwoDecimal(value),
                                required: false
                            }
                        }
                    ],
                    remarks: {
                        type: String,
                        required: false
                    },
                    qualityReleaseBy: {
                        type: String,
                        required: false
                    }
                },
                releaseQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
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
    }
);

sampleJCEntrySchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.jcEntryCode = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
sampleJCEntrySchema.plugin(paginatePlugin);
const sampleJCEntry = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, sampleJCEntrySchema);

module.exports = sampleJCEntry;
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
