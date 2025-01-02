const mongoose = require("mongoose");
const Audit = require("../../../controllers/v1/settings/audit/audit");
const {STOCK_CUTTING: SCHEMA_CONSTANT} = require("../../../mocks/schemasConstant/productionConstant");
const {paginatePlugin} = require("../../plugins/paginatePlugin");
const {PPIC_STAGES} = require("../../../mocks/constantData");
const {setTwoDecimal} = require("../../../helpers/utility");
const stockCuttingSchema = new mongoose.Schema(
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
        processName: {
            type: String,
            required: false,
            enum: PPIC_STAGES.getStages()
        },
        jobCard: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "JobCardCreation"
        },
        SKUProcessFlow: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "ProdProcessConfig"
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
        SKUBatchQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        stockCuttingDetails: [
            {
                reference: {
                    type: mongoose.Schema.Types.ObjectId,
                    refPath: "referenceModel"
                },
                referenceModel: {
                    enum: ["ProductionItem", "Items", "InkMaster", "ChildItem"],
                    type: String
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
                U1: {
                    type: String,
                    required: false
                },
                U1Qty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                width: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                widthUnit: {
                    type: String,
                    required: false
                },
                length: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                lengthUnit: {
                    type: String,
                    required: false
                },
                MF: {
                    //  U2Qty/U1Qty
                    type: String,
                    required: false
                },
                U2: {
                    type: String,
                    required: false
                },
                U2Qty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                select: {
                    type: Boolean,
                    required: false
                },
                isSaved: {
                    type: Boolean,
                    required: false
                },
                PPICOpeningStock: [
                    {
                        inventory: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: false,
                            ref: "InventoryCorrection"
                        },
                        MRNNo: {
                            type: String,
                            required: false
                        },
                        MRN: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: false,
                            ref: "MRN"
                        },
                        item: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: false,
                            ref: "Items"
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
                        U1: {
                            type: String,
                            required: false
                        },
                        U1Qty: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        width: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        widthUnit: {
                            type: String,
                            required: false
                        },
                        length: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        lengthUnit: {
                            type: String,
                            required: false
                        },
                        MF: {
                            type: String,
                            required: false
                        },
                        U2: {
                            type: String,
                            required: false
                        },
                        U2Qty: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        select: {
                            type: Boolean,
                            required: false
                        }
                    }
                ],
                U2TotalQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                PPICToProductionGT: [
                    {
                        inventory: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: false,
                            ref: "InventoryCorrection"
                        },
                        MRNNo: {
                            type: String,
                            required: false
                        },
                        MRN: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: false,
                            ref: "MRN"
                        },
                        item: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: false,
                            ref: "Items"
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
                        U1: {
                            type: String,
                            required: false
                        },
                        U1Qty: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        width: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        widthUnit: {
                            type: String,
                            required: false
                        },
                        length: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        lengthUnit: {
                            type: String,
                            required: false
                        },
                        MF: {
                            type: String,
                            required: false
                        },
                        U2: {
                            type: String,
                            required: false
                        },
                        U2Qty: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        }
                    }
                ],
                PPICClosingStockCalculated: [
                    {
                        inventory: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: false,
                            ref: "InventoryCorrection"
                        },
                        MRNNo: {
                            type: String,
                            required: false
                        },
                        MRN: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: false,
                            ref: "MRN"
                        },
                        item: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: false,
                            ref: "Items"
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
                        U1: {
                            type: String,
                            required: false
                        },
                        U1Qty: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        width: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        widthUnit: {
                            type: String,
                            required: false
                        },
                        length: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        lengthUnit: {
                            type: String,
                            required: false
                        },
                        MF: {
                            type: String,
                            required: false
                        },
                        U2: {
                            type: String,
                            required: false
                        },
                        U2Qty: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        }
                    }
                ],
                PPICClosingStockActual: [
                    {
                        inventory: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: false,
                            ref: "InventoryCorrection"
                        },
                        MRNNo: {
                            type: String,
                            required: false
                        },
                        MRN: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: false,
                            ref: "MRN"
                        },
                        item: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: false,
                            ref: "Items"
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
                        U1: {
                            type: String,
                            required: false
                        },
                        U1Qty: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        width: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        widthUnit: {
                            type: String,
                            required: false
                        },
                        length: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        lengthUnit: {
                            type: String,
                            required: false
                        },
                        MF: {
                            type: String,
                            required: false
                        },
                        U2: {
                            type: String,
                            required: false
                        },
                        U2Qty: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        }
                    }
                ],
                rejectionQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                rejectionPercent: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                logEntry: {
                    prodSource: {
                        type: String,
                        required: false
                    },
                    cumulativeCount: {
                        type: Number,
                        set: value => setTwoDecimal(value),
                        required: false
                    },
                    remarks: {
                        type: String,
                        required: false
                    },
                    prodAuthorizedBy: {
                        type: String,
                        required: false
                    },
                    logEntryDetails: [
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
                    ]
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

stockCuttingSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
stockCuttingSchema.plugin(paginatePlugin);
const stockCutting = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, stockCuttingSchema);

module.exports = stockCutting;
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
