const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {JOB_WORK_CHALLAN: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/purchaseConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const {setTwoDecimal} = require("../../helpers/utility");
const jobWorkChallanSchema = new mongoose.Schema(
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
        JWChallanNo: {
            type: String,
            required: false
        },
        JWChallanDate: {
            type: Date,
            required: false
        },
        jobWorker: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Supplier"
        },
        jobWorkerName: {
            type: String,
            required: false
        },
        currency: {
            type: String,
            required: false
        },
        addressType: {
            type: String,
            required: false
        },
        GSTINNo: {
            type: String,
            required: false
        },
        primaryAddress: {
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
        shipToAddress: {
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
        placeOfSupply: {
            type: String,
            required: false
        },
        JWChallanDetails: [
            {
                // sr no
                JWLChallanLineNo: {
                    type: Number,
                    required: false
                },
                item: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    refPath: "referenceModel"
                },
                referenceModel: {
                    type: String,
                    enum: ["ProductionItem", "Items", "ChildItem"],
                    default: "Items"
                },
                itemCode: {
                    type: String,
                    required: false
                },
                itemName: {
                    type: String,
                    required: false
                },
                itemDescription: {
                    type: String,
                    required: false
                },
                UOM: {
                    type: String,
                    required: false
                },
                primaryToSecondaryConversion: {
                    type: Number,
                    required: false
                },
                primaryUnit: {
                    type: String,
                    required: false
                },
                secondaryUnit: {
                    type: String,
                    required: false
                },
                conversionOfUnits: {
                    type: String,
                    required: false
                },
                currency: {
                    type: String,
                    required: false
                },
                HSNCode: {
                    type: Number,
                    required: false
                },
                gst: {
                    type: Number,
                    required: false,
                    default: 0
                },
                igst: {
                    type: Number,
                    required: false,
                    default: 0
                },
                cgst: {
                    type: Number,
                    required: false,
                    default: 0
                },
                sgst: {
                    type: Number,
                    required: false,
                    default: 0
                },
                ugst: {
                    type: Number,
                    required: false,
                    default: 0
                },
                unitRate: {
                    type: Number,
                    set: value => setTwoDecimal(value, 3),
                    required: false
                },
                stdCostUom1: {
                    type: Number,
                    set: value => setTwoDecimal(value, 3),
                    required: false
                },
                stdCostUom2: {
                    type: Number,
                    set: value => setTwoDecimal(value, 3),
                    required: false
                },
                closedIRQty: {
                    type: Number,
                    required: false
                },
                quantity: {
                    type: Number,
                    required: false
                },
                taxableAmt: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                }
            }
        ],
        totalTaxableAmt: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        freightTermsInfo: {
            modeOfTransport: {
                type: String,
                required: false
            },
            transporterName: {
                type: String,
                required: false
            },
            vehicleNo: {
                type: String,
                required: false
            },
            freightTerms: {
                type: String,
                required: false
            },
            destination: {
                type: String,
                required: false
            }
        },
        jobWorkDetails: {
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
            SAC: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: "SAC"
            },
            SACCode: {
                type: String,
                required: false
            },
            gst: {
                type: Number,
                required: false,
                default: 0
            },
            igst: {
                type: Number,
                required: false,
                default: 0
            },
            cgst: {
                type: Number,
                required: false,
                default: 0
            },
            sgst: {
                type: Number,
                required: false,
                default: 0
            },
            ugst: {
                type: Number,
                required: false,
                default: 0
            },
            descriptionOfService: {
                type: String,
                required: false
            },
            partNo: {
                type: String,
                required: false
            }
        },
        cancelReason: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: [
                OPTIONS.defaultStatus.AWAITING_APPROVAL,
                OPTIONS.defaultStatus.APPROVED,
                OPTIONS.defaultStatus.REJECTED,
                OPTIONS.defaultStatus.REPORT_GENERATED,
                OPTIONS.defaultStatus.GRN_PARTIAL_CREATED,
                OPTIONS.defaultStatus.GRN_CREATED,
                OPTIONS.defaultStatus.CLOSED,
                OPTIONS.defaultStatus.CANCELLED,
                OPTIONS.defaultStatus.SUPPLEMENTARY_PO
            ],
            default: OPTIONS.defaultStatus.AWAITING_APPROVAL
        },
        validUpto: {
            type: String,
            required: false
        },
        ewayBillNo: {
            type: String,
            required: false
        },
        ewayBillDate: {
            type: String,
            required: false
        },
        EWayBillPdfUrl: {
            type: String,
            required: false
        },
        EWayBillQrCodeUrl: {
            type: String,
            required: false
        },
        eWayBillStatus: {
            type: String,
            required: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

jobWorkChallanSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.JWChallanNo = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
jobWorkChallanSchema.plugin(paginatePlugin);
const jobWorkChallan = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, jobWorkChallanSchema);

module.exports = jobWorkChallan;
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
