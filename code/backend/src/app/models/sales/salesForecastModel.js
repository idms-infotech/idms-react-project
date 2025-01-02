const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {SALES_FORECAST: SCHEMA_CONST} = require("../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin, reportPaginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const salesForecastSchema = new mongoose.Schema(
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
        customerCategory: {
            type: String,
            required: true
        },
        categoryType: {
            type: String,
            required: false
        },
        FCNo: {
            type: String,
            required: true
        },
        FCDate: {
            type: Date,
            required: false
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Customer"
        },
        customerName: {
            type: String,
            required: false
        },
        FCType: {
            type: String,
            required: false
        },
        currency: {
            type: String,
            required: false
        },
        salesForecastDetails: [
            {
                FCLineNumber: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: true
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
                UOM: {
                    type: String,
                    required: false
                },
                customerPartNo: {
                    type: String,
                    required: false
                },
                standardRate: {
                    // rate/unit
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: true
                },
                discount: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: true
                },
                netRate: {
                    // standardRate - (standardRate * discount)
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: true
                },
                lineTargetDate: {
                    type: Date,
                    required: false
                },
                orderedQty: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: true
                },
                lineValue: {
                    // orderedQty * netRate
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: true
                },
                invoicedQty: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false,
                    default: 0
                },
                balancedQty: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false,
                    default: 0
                },
                previousDRNQty: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false,
                    default: 0
                },
                JCCQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                previousJCCQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                canceledQty: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false,
                    default: 0
                },
                canceledReason: {
                    type: String,
                    required: false
                },
                lineStatus: {
                    type: String,
                    required: false
                },
                releaseCount: {
                    type: Number,
                    required: false
                },
                releaseSchedule: [
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
                        }
                    }
                ],
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
                rateType: {
                    type: String,
                    required: false
                },
                sellingRateCommon: [
                    {
                        currency: {
                            type: String,
                            required: false
                        },
                        unit1: {
                            type: String,
                            required: false
                        },
                        MOQ1: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        rate1: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        unit2: {
                            type: String,
                            required: false
                        },
                        MOQ2: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        rate2: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        select: {
                            type: Boolean,
                            required: false
                        }
                    }
                ]
            }
        ],
        netFCValue: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        status: {
            type: String,
            required: false
            // enum: ["Created", "Invoiced", "Cancelled", "Closed", "Approved", "Report Generated"],
            // enum: OPTIONS.defaultStatus.getAllSalesOrderStatusAsArray(),
            // default: "Created",
        },
        FCCancellationReason: {
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

salesForecastSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.FCNo = await getAndSetAutoIncrementNo({...SCHEMA_CONST.AUTO_INCREMENT_DATA()}, this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
salesForecastSchema.index({status: -1});
salesForecastSchema.index({FCDate: -1});
salesForecastSchema.plugin(paginatePlugin);
salesForecastSchema.plugin(reportPaginatePlugin);
const SalesForecast = mongoose.model("SalesForecast", salesForecastSchema);

module.exports = SalesForecast;
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
