const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {JOB_WORK_ORDER: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/purchaseConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin, reportPaginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const {OPTIONS} = require("../../helpers/global.options");

const jobWorkOrderSchema = new mongoose.Schema(
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
        WONo: {
            type: String,
            required: false
        },
        WODate: {
            type: Date,
            required: false
        },
        jobWorker: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Supplier"
        },
        jobWorkerName: {
            type: String,
            required: false
        },
        orderReference: {
            type: String,
            required: false
        },
        GSTINNo: {
            type: String,
            required: false
        },
        placeOfSupply: {
            type: String,
            required: false
        },
        paymentTerms: {
            type: String,
            required: false
        },
        freightTerms: {
            type: String,
            required: false
        },
        WORemarks: {
            type: String,
            required: false
        },
        billFromJobWorker: {
            addressLabel: {
                type: String,
                required: false,
                trim: true
            },
            country: {
                type: String,
                required: false,
                trim: true
            },
            state: {
                type: String,
                required: false,
                trim: true
            },
            city: {
                type: String,
                required: false,
                trim: true
            },
            pinCode: {
                type: String,
                required: false,
                trim: true
            },
            line1: {
                type: String,
                required: false,
                trim: true
            },
            line2: {
                type: String,
                required: false,
                trim: true
            },
            line3: {
                type: String,
                required: false,
                trim: true
            },
            line4: {
                type: String,
                required: false,
                trim: true
            }
        },
        shipFromJobWorker: {
            addressLabel: {
                type: String,
                required: false,
                trim: true
            },
            country: {
                type: String,
                required: false,
                trim: true
            },
            state: {
                type: String,
                required: false,
                trim: true
            },
            city: {
                type: String,
                required: false,
                trim: true
            },
            pinCode: {
                type: String,
                required: false,
                trim: true
            },
            line1: {
                type: String,
                required: false,
                trim: true
            },
            line2: {
                type: String,
                required: false,
                trim: true
            },
            line3: {
                type: String,
                required: false,
                trim: true
            },
            line4: {
                type: String,
                required: false,
                trim: true
            }
        },
        billToCompany: {
            companyName: {
                type: String,
                required: false
            },
            GSTIN: {
                type: String,
                required: false
            },
            billFromLocation: {
                type: String,
                required: false,
                trim: true
            },
            country: {
                type: String,
                required: false,
                trim: true
            },
            state: {
                type: String,
                required: false,
                trim: true
            },
            city: {
                type: String,
                required: false,
                trim: true
            },
            pinCode: {
                type: String,
                required: false,
                trim: true
            },
            line1: {
                type: String,
                required: false,
                trim: true
            },
            line2: {
                type: String,
                required: false,
                trim: true
            },
            line3: {
                type: String,
                required: false,
                trim: true
            },
            line4: {
                type: String,
                required: false,
                trim: true
            }
        },
        shipToCompany: {
            companyName: {
                type: String,
                required: false
            },
            GSTIN: {
                type: String,
                required: false
            },
            billFromLocation: {
                type: String,
                required: false,
                trim: true
            },
            country: {
                type: String,
                required: false,
                trim: true
            },
            state: {
                type: String,
                required: false,
                trim: true
            },
            city: {
                type: String,
                required: false,
                trim: true
            },
            pinCode: {
                type: String,
                required: false,
                trim: true
            },
            line1: {
                type: String,
                required: false,
                trim: true
            },
            line2: {
                type: String,
                required: false,
                trim: true
            },
            line3: {
                type: String,
                required: false,
                trim: true
            },
            line4: {
                type: String,
                required: false,
                trim: true
            }
        },
        WODetails: [
            {
                jobWorkService: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "ServiceMaster"
                },
                jobWorkCode: {
                    type: String,
                    required: false
                },
                SACInfo: {
                    SACCode: {
                        type: String,
                        required: false
                    },
                    natureOfJobWork: {
                        type: String,
                        required: false
                    },
                    gstRate: {
                        type: Number,
                        required: false
                    },
                    igstRate: {
                        type: Number,
                        required: false
                    },
                    sgstRate: {
                        type: Number,
                        required: false
                    },
                    cgstRate: {
                        type: Number,
                        required: false
                    },
                    ugstRate: {
                        type: Number,
                        required: false
                    }
                },
                jobWorkItem: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "JobWorkItemMaster"
                },
                jobWorkItemCode: {
                    type: String,
                    required: false
                },
                jobWorkItemName: {
                    type: String,
                    required: false
                },
                jobWorkItemDescription: {
                    type: String,
                    required: false
                },
                drawingNo: {
                    type: String,
                    required: false
                },
                HSNInfo: {
                    HSNCode: {
                        type: String,
                        required: false
                    },
                    gstRate: {
                        type: Number,
                        required: false
                    },
                    igstRate: {
                        type: Number,
                        required: false
                    },
                    sgstRate: {
                        type: Number,
                        required: false
                    },
                    cgstRate: {
                        type: Number,
                        required: false
                    },
                    ugstRate: {
                        type: Number,
                        required: false
                    }
                },
                UOM: {
                    type: String,
                    required: false
                },
                processRatePerUnit: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                discountPercent: {
                    type: String,
                    // set: value => setTwoDecimal(value),
                    required: false
                },
                netRatePerUnit: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                quantity: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                taxableValue: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                deliveryDate: {
                    type: String,
                    required: false
                },
                deliveryCount: {
                    type: Number,
                    required: false
                },
                deliverySchedule: [
                    {
                        scheduleNo: {
                            type: Number,
                            required: false
                        },
                        quantity: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        deliveryDate: {
                            type: Date,
                            required: false
                        }
                    }
                ]
            }
        ],
        WOTaxableValue: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        remarks: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: [
                OPTIONS.defaultStatus.AWAITING_APPROVAL,
                OPTIONS.defaultStatus.APPROVED,
                OPTIONS.defaultStatus.REPORT_GENERATED,
                OPTIONS.defaultStatus.REJECTED
            ],
            default: OPTIONS.defaultStatus.AWAITING_APPROVAL
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

jobWorkOrderSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.WONo = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
jobWorkOrderSchema.plugin(paginatePlugin);
jobWorkOrderSchema.plugin(reportPaginatePlugin);
const jobWorkOrder = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, jobWorkOrderSchema);

module.exports = jobWorkOrder;
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
