const {default: mongoose} = require("mongoose");
const {OPTIONS} = require("../../../helpers/global.options");

exports.SCHEMA = {
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
    reference: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "referenceModel"
    },
    referenceModel: {
        type: String,
        enum: ["Customer", "Prospect"]
    },
    orderType: {
        type: String,
        required: false
    },
    DSKUDetails: [
        {
            NPD: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: "NPD"
            },
            NPDNo: {
                type: String,
                required: false
            },
            NPDDate: {
                type: Date,
                required: false,
                default: new Date()
            },
            code: {
                type: String,
                required: false
            },
            DSKU: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: "NPDMaster"
            },
            DSKUNo: {
                type: String,
                required: false
            },
            DSKUName: {
                type: String,
                required: false
            },
            DSKUDescription: {
                type: String,
                required: false
            },
            drawing: {
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
            batchQty: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            }
        }
    ],
    SKUDetails: [
        {
            reference: {
                type: mongoose.Schema.Types.ObjectId,
                refPath: "referenceModel"
            },
            referenceModel: {
                type: String,
                enum: ["SalesOrder", "SalesForecast"]
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
                required: false,
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
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
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
                        set: value => {
                            if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                                return parseFloat(value).toFixed(2);
                            }
                        },
                        required: false
                    },
                    dispatchDate: {
                        type: Date,
                        required: false
                    },
                    PPICDate: {
                        type: Date,
                        required: false
                    },
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
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
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
        default: OPTIONS.defaultStatus.AWAITING_REVIEW,
        enum: OPTIONS.defaultStatus.getAllFilterStatusArray([
            "AWAITING_APPROVAL",
            "APPROVED",
            "CANCELLED",
            "REPORT_GENERATED"
        ])
    }
};
