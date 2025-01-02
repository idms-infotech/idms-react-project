const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {GOODS_ISSUE_PPIC_TO_PRODUCTION: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/planningConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const {setTwoDecimal} = require("../../helpers/utility");
const goodsIssuePPICToProductionSchema = new mongoose.Schema(
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
        goodsIssueNo: {
            type: String,
            required: false
        },
        goodsIssueDate: {
            type: Date,
            required: false,
            default: new Date()
        },
        goodsIssueTo: {
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
        rejectionRemarks: {
            type: String,
            required: false
        },
        MRNDetails: [
            {
                MRN: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "MRN"
                },
                WIP: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "WIPInventory"
                },
                SFG: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "SFGStock"
                },
                MRNNumber: {
                    type: String,
                    required: false
                },
                MRNDate: {
                    type: Date,
                    required: true,
                    default: new Date()
                },
                item: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    refPath: "referenceModel"
                },
                referenceModel: {
                    type: String,
                    enum: ["ProductionItem", "Items", "ChildItem"]
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
                conversionOfUnits: {
                    type: String,
                    required: false
                },
                PPICQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
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
                aging: {
                    type: String,
                    required: false
                },
                expiryDate: {
                    type: Date,
                    required: false
                },
                issueQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                }
            }
        ],
        status: {
            type: String,
            required: false,
            enum: [
                OPTIONS.defaultStatus.AWAITING_APPROVAL,
                OPTIONS.defaultStatus.APPROVED,
                OPTIONS.defaultStatus.REJECTED,
                OPTIONS.defaultStatus.ACKNOWLEDGED
            ],
            default: OPTIONS.defaultStatus.AWAITING_APPROVAL
        },
        PPICRemarksDetail: {
            PPICRemarks: {
                type: String,
                required: false
            },
            issueBy: {
                type: String,
                required: false
            },
            approvedBy: {
                type: String,
                required: false
            },
            approvedDate: {
                type: Date,
                required: false
            }
        },
        QARemarksDetail: {
            QARemark: {
                type: String,
                required: false
            },
            checkedBy: {
                type: String,
                required: false
            },
            approvedBy: {
                type: String,
                required: false
            },
            approvedDate: {
                type: Date,
                required: false
            }
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

goodsIssuePPICToProductionSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.goodsIssueNo = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
goodsIssuePPICToProductionSchema.plugin(paginatePlugin);
const goodsIssuePPICToProduction = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, goodsIssuePPICToProductionSchema);

module.exports = goodsIssuePPICToProduction;
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
