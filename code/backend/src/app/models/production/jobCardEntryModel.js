const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {JOB_CARD_ENTRY: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/productionConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin, reportPaginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const jobCardEntrySchema = new mongoose.Schema(
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
        jobCardEntryCode: {
            type: String,
            required: false
        },
        jobCard: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "JobCardCreation"
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
        SKUStage: {
            type: String,
            required: false
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
        batchQty: {
            type: Number,
            required: false
        },
        batchDate: {
            type: Date,
            required: false
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Customer"
        },
        customerName: {
            type: String,
            required: false
        },
        productionEntry: [
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
                processName: {
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
                },
                processStatus: {
                    type: Boolean,
                    required: false
                }
            }
        ],
        generateReport: {
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
            batchRejQty: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            jobCardClosureDate: {
                type: Date,
                required: false
            },
            location: {
                type: String,
                required: false
            },
            checkoutStatus: {
                type: String,
                required: false
            }
        },
        rejectionData: [
            {
                SN: {
                    type: Number,
                    required: false
                },
                rejectionType: {
                    type: String,
                    required: false
                },
                quantity: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                percentage: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                }
            }
        ],
        rejectedTotalQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        rejectedPercent: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        rejectStatus: {
            type: String,
            required: false
        },
        rejectRemarks: [
            {
                defect: {
                    type: String,
                    required: false
                },
                remarks: {
                    type: String,
                    required: false
                },
                remarksBy: {
                    type: String,
                    required: false
                }
            }
        ]
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);
jobCardEntrySchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.jobCardEntryCode = await getAndSetAutoIncrementNo(
            SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(),
            this.company,
            true
        );
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
jobCardEntrySchema.plugin(paginatePlugin);
jobCardEntrySchema.plugin(reportPaginatePlugin);
const jobCardEntry = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, jobCardEntrySchema);

module.exports = jobCardEntry;
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
