const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {GOODS_TRANSFER_REQUEST: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/planningConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const {OPTIONS} = require("../../helpers/global.options");
const goodsTransferRequestSchema = new mongoose.Schema(
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
        GTRequestNo: {
            type: String,
            required: false
        },
        GTRequestDate: {
            type: Date,
            required: false,
            default: new Date()
        },
        location: {
            type: String,
            required: false
        },
        fromDepartment: {
            type: String,
            required: false
        },
        toDepartment: {
            type: String,
            required: false
        },
        fromDepartmentName: {
            type: String,
            required: false
        },
        toDepartmentName: {
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
        rejectRemarks: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: [
                OPTIONS.defaultStatus.AWAITING_APPROVAL,
                OPTIONS.defaultStatus.APPROVED,
                OPTIONS.defaultStatus.REJECTED
            ],
            default: OPTIONS.defaultStatus.AWAITING_APPROVAL
        },
        remarks: {
            reasonForGTRequest: {
                type: String,
                required: false
            },
            jobCardReference: {
                type: String,
                required: false
            },
            requestedBy: {
                type: String,
                required: false
            }
        },
        GTRequestDetails: [
            {
                GTRequestLineNumber: {
                    type: Number,
                    required: false,
                    default: 1
                },
                item: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    refPath: "refItems"
                },
                refItems: {
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
                UOM: {
                    type: String,
                    required: false
                },
                conversionOfUnits: {
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
                IRQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                GTRequestQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                // Issue Qty
                // GTQty: {
                //     type: Number,
                //     set: value => setTwoDecimal(value),
                //     required: false
                // },
                balancedQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                previousGTRequestQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
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

goodsTransferRequestSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.GTRequestNo = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
goodsTransferRequestSchema.plugin(paginatePlugin);
const goodsTransferRequest = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, goodsTransferRequestSchema);

module.exports = goodsTransferRequest;
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
