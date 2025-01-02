const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {MATERIAL_REVALIDATION: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/qualityConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const {setTwoDecimal} = require("../../helpers/utility");
const materialRevalidationSchema = new mongoose.Schema(
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
        MRVNumber: {
            type: String,
            required: true
        },
        MRVDate: {
            type: Date,
            required: true,
            default: new Date()
        },
        location: {
            type: String,
            required: false
        },
        inventoryZoneId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "InvZoneConfig"
        },
        invZoneName: {
            type: String,
            required: false
        },
        MRVStatus: {
            type: String,
            required: false,
            enum: [
                OPTIONS.defaultStatus.APPROVED,
                OPTIONS.defaultStatus.REJECTED,
                OPTIONS.defaultStatus.REPORT_GENERATED,
                OPTIONS.defaultStatus.AWAITING_APPROVAL,
                OPTIONS.defaultStatus.CLOSED
            ],
            default: OPTIONS.defaultStatus.AWAITING_APPROVAL
        },
        QCRemarks: {
            type: String,
            required: false
        },
        MRVDetails: [
            {
                rejectedMRN: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "MRN"
                },
                MRN: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "MRN"
                },
                MRNNumber: {
                    type: String
                },
                supplier: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    refPath: "supplierRef"
                },
                supplierRef: {
                    type: String,
                    enum: ["Customer", "Supplier"],
                    default: "Supplier"
                },
                supplierName: {
                    type: String,
                    required: false
                },
                item: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "referenceModel"
                },
                referenceModel: {
                    type: String,
                    enum: ["Items", "ProductionItem"],
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
                    required: false
                },
                standardRate: {
                    type: Number,
                    set: value => setTwoDecimal(value, 3),
                    required: false
                },
                purchaseRate: {
                    type: Number,
                    set: value => setTwoDecimal(value, 3),
                    required: false
                },
                invoiceRate: {
                    type: Number,
                    set: value => setTwoDecimal(value, 3),
                    required: false
                },
                QRTQty: {
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
        ]
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

materialRevalidationSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.MRVNumber = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
materialRevalidationSchema.plugin(paginatePlugin);
const MaterialRevalidation = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, materialRevalidationSchema);

module.exports = MaterialRevalidation;
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
