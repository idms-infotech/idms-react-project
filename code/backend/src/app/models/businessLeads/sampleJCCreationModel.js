const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {SAMPLE_JC_CREATION: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/businessLeadsConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const {setTwoDecimal} = require("../../helpers/utility");
const sampleJCCreationSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
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
        stage: {
            type: String,
            required: false
        },
        jobCardNo: {
            type: String,
            required: false
        },
        jobCardDate: {
            type: Date,
            required: false,
            default: new Date()
        },
        customerCategory: {
            type: String,
            required: false
        },
        categoryType: {
            type: String,
            required: false
        },
        customerName: {
            type: String,
            required: false
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Customer"
        },
        orderType: {
            type: String,
            required: false
        },
        SKUDetails: [
            {
                sampleRequest: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "SampleRequest"
                },
                SO_FCNumber: {
                    type: String,
                    required: false
                },
                SO_FCDate: {
                    type: Date,
                    required: false,
                    default: new Date()
                },
                SKU: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "SKUMaster"
                },
                code: {
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
                drawing: {
                    type: String,
                    required: false
                },
                internalPartNo: {
                    type: String,
                    required: false
                },
                UOM: {
                    type: String,
                    required: false
                },
                balQty: {
                    type: Number,
                    required: false
                },
                totalFGQty: {
                    type: Number,
                    required: false
                },
                FGInventoryInfo: [
                    {
                        batchNo: {
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
                        FGQty: {
                            type: Number,
                            required: false
                        },
                        aging: {
                            type: String,
                            required: false
                        }
                    }
                ],
                batchQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                dispatchSchedule: [
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
                        dispatchDate: {
                            type: Date,
                            required: false
                        },
                        PPICDate: {
                            type: Date,
                            required: false
                        }
                    }
                ],
                SO_FCLineTargetDate: {
                    type: Date,
                    required: false
                },
                // Total SO Qty / FC Qty
                totalQty: {
                    type: Number,
                    required: false
                }
            }
        ],
        batchInfo: {
            totalBatchQuantity: {
                type: Number,
                set: value => setTwoDecimal(value),
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
            }
        },
        NPDInput: {
            type: String,
            required: false
        },
        JCCancellationReason: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: false,
            default: OPTIONS.defaultStatus.AWAITING_APPROVAL,
            enum: [
                OPTIONS.defaultStatus.AWAITING_APPROVAL,
                OPTIONS.defaultStatus.APPROVED,
                OPTIONS.defaultStatus.CANCELLED,
                OPTIONS.defaultStatus.REPORT_GENERATED
            ]
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

sampleJCCreationSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.jobCardNo = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
sampleJCCreationSchema.plugin(paginatePlugin);
const sampleJCCreation = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, sampleJCCreationSchema);

module.exports = sampleJCCreation;
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
