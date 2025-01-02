const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {
    MATERIAL_RECEIPT_NOTE: SCHEMA_CONST,
    DIRECT_MATERIAL_RECEIPT_NOTE,
    DIRECT_MRN_CHILD_ITEM
} = require("../../mocks/schemasConstant/qualityConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const {OPTIONS} = require("../../helpers/global.options");
const {PO_RATE_DECIMAL} = require("../../mocks/constantData");
const MRNSchema = new mongoose.Schema(
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
        MRNNumber: {
            type: String,
            required: true
        },
        MRNDate: {
            type: Date,
            required: true,
            default: new Date()
        },
        GRNNumber: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "GRN"
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            refPath: "referenceModel"
        },
        referenceModel: {
            type: String,
            enum: ["Customer", "Supplier"],
            default: "Supplier"
        },
        supplierName: {
            type: String,
            required: false
        },
        supplierInvoice: {
            type: String,
            required: false
        },
        supplierDate: {
            type: Date,
            required: true,
            default: new Date()
        },
        currency: {
            type: String,
            required: false
        },
        MRNStatus: {
            type: String,
            required: false,
            enum: [
                "Partially Released",
                "Report Generated",
                "Released",
                "Closed",
                "Created",
                // New Status
                OPTIONS.defaultStatus.AWAITING_APPROVAL,
                OPTIONS.defaultStatus.APPROVED,
                OPTIONS.defaultStatus.REJECTED,
                OPTIONS.defaultStatus.REPORT_GENERATED
            ],
            default: "Created"
        },
        MRNDetails: [
            {
                MRNLineNumber: {
                    type: Number,
                    required: false
                },
                GRNLineNumber: {
                    type: Number,
                    required: false
                },
                item: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "referenceModel"
                },
                referenceModel: {
                    type: String,
                    enum: ["Items", "ProductionItem", "ChildItem"],
                    default: "Items"
                },
                itemType: {
                    type: String,
                    required: false
                },
                primaryToSecondaryConversion: {
                    type: Number,
                    required: false
                },
                secondaryToPrimaryConversion: {
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
                UOM: {
                    type: String,
                    required: true
                },
                standardRate: {
                    type: Number,
                    set: value => setTwoDecimal(value, PO_RATE_DECIMAL),
                    required: false
                },
                purchaseRate: {
                    type: Number,
                    set: value => setTwoDecimal(value, PO_RATE_DECIMAL),
                    required: false
                },
                invoiceRate: {
                    type: Number,
                    set: value => setTwoDecimal(value, PO_RATE_DECIMAL),
                    required: false
                },
                GRNQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                releasedQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                rejectedQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                batchNo: {
                    type: String,
                    required: false
                },
                batchDate: {
                    type: Date,
                    required: false
                },
                QCLevels: {
                    type: String,
                    required: false
                },
                QCLevelsDetails: [
                    {
                        seq: {type: Number},
                        specificationCode: {type: String},
                        characteristic: {type: String},
                        UOM: {type: String},
                        testStandard: {type: String},
                        measuringInstrument: {type: String},
                        specValue: {type: String},
                        LTL: {type: Number},
                        UTL: {type: Number},
                        // observation: {type: String},
                        tolerance: {type: Number},
                        sampleCount: {type: Number},
                        authorizedBy: {type: String},
                        testResults: [
                            {
                                seq: {type: Number},
                                testDate: {type: Date},
                                checkedBy: {type: String},
                                specValue: {type: String},
                                LTL: {type: Number},
                                UTL: {type: Number},
                                observation: {type: String}
                            }
                        ]
                    }
                ],
                status: {
                    type: String,
                    required: false
                },
                deviationApprovedBy: {type: String}
            }
        ],
        deliveryLocation: {
            type: String,
            required: false
        },
        GRNRemarks: {
            type: String,
            required: false
        },
        MRNRemarks: {
            type: String,
            required: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
MRNSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        if (this.MRNNumber == "0000000") {
            this.MRNNumber = 0;
        } else if (this.MRNNumber == "MRS/0000") {
            this.MRNNumber = await getAndSetAutoIncrementNo(
                {...DIRECT_MATERIAL_RECEIPT_NOTE.AUTO_INCREMENT_DATA()},
                this.company,
                true
            );
        } else if (this.MRNNumber == "MRC/0000") {
            this.MRNNumber = await getAndSetAutoIncrementNo(
                {...DIRECT_MRN_CHILD_ITEM.AUTO_INCREMENT_DATA()},
                this.company,
                true
            );
        } else {
            this.MRNNumber = await getAndSetAutoIncrementNo(
                {...SCHEMA_CONST.AUTO_INCREMENT_DATA()},
                this.company,
                true
            );
        }
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

MRNSchema.index({MRNDate: -1});
MRNSchema.index({MRNStatus: -1});
MRNSchema.plugin(paginatePlugin);

const MRN = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, MRNSchema);
module.exports = MRN;
const auditTrail = async (master, modifiedPaths, isNew, isModified) => {
    const {createdBy, updatedBy, company} = master;
    const auditTrail = {
        company: company,
        oldData: JSON.stringify(await master.constructor.findById(master._id)),
        data: JSON.stringify(master),
        user: isNew ? createdBy : updatedBy, // Replace with the actual current user's name
        action: isNew ? SCHEMA_CONST.ADDED_ACTION : SCHEMA_CONST.UPDATED_ACTION,
        fieldsModified: modifiedPaths.toString()
    };
    await Audit.auditModule(auditTrail);
};
