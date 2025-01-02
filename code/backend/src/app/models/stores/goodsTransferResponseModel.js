const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {GOODS_TRANSFER_RESPONSE: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/storesConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const {OPTIONS} = require("../../helpers/global.options");
const goodsTransferResponseSchema = new mongoose.Schema(
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
        GTNo: {
            type: String,
            required: false
        },
        GTDate: {
            type: Date,
            required: false,
            default: new Date()
        },
        GTRequest: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "GoodsTransferRequest"
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
        toDepartment: {
            type: String,
            required: false
        },
        fromDepartment: {
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
            goodsIssuedBy: {
                type: String,
                required: false
            },
            goodsIssuedTo: {
                type: String,
                required: false
            },
            GTRemarks: {
                type: String,
                required: false
            }
        },
        GTDetails: [
            {
                GTLineNumber: {
                    type: Number,
                    required: false,
                    default: 1
                },
                GTRequestLineNumber: {
                    type: Number,
                    required: false,
                    default: 1
                },
                item: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "Items"
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
                GTRQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                FIFO: [
                    {
                        GINDate: {
                            type: Date,
                            required: true,
                            default: new Date()
                        },
                        IC: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: true,
                            ref: "InventoryCorrection"
                        },
                        GIN: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: true,
                            ref: "GoodInwardEntry"
                        },
                        MRN: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: true,
                            ref: "MRN"
                        },
                        MRNNo: {
                            type: String,
                            required: false
                        },
                        MRNDate: {
                            type: Date,
                            required: false
                        },
                        expiryDate: {
                            type: Date,
                            required: false
                        },
                        UOM: {
                            type: String,
                            required: false
                        },
                        IRQty: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        GTQty: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        }
                        // receiptQty: {
                        //     type: Number,
                        //     set: value => setTwoDecimal(value),
                        //     required: false
                        // },
                        // diffQty: {
                        //     type: Number,
                        //     set: value => setTwoDecimal(value),
                        //     required: false
                        // },
                        // inventoryQty: {
                        //     type: Number,
                        //     set: value => setTwoDecimal(value),
                        //     required: false
                        // },
                        // WIPQty: {
                        //     type: Number,
                        //     set: value => setTwoDecimal(value),
                        //     required: false
                        // }
                    }
                ],
                GTQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                }
            }
        ],
        rejectionRemarks: {
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

goodsTransferResponseSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.GTNo = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
goodsTransferResponseSchema.plugin(paginatePlugin);
const goodsTransferResponse = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, goodsTransferResponseSchema);

module.exports = goodsTransferResponse;
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
