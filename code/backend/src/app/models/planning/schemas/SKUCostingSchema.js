const {default: mongoose} = require("mongoose");
const {OPTIONS} = require("../../../helpers/global.options");

exports.SCHEMA =  {
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
    costingCode: {
        type: String,
        required: false
    },
    costingDate: {
        type: Date,
        required: false,
        default: new Date()
    },
    costingDescription: {
        type: String,
        required: false
    },
    revision: {
        type: String,
        required: false
    },
    SKU: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "SKUMaster"
    },
    SKUCode: {
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
    UoM: {
        type: String,
        required: false
    },
    BOMCostBreakdown: [
        {
            itemCategory: {
                type: String,
                required: false
            },
            itemCode: {
                type: String,
                required: false
            },
            itemDescription: {
                type: String,
                required: false
            },
            qty: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            UOM: {
                type: String,
                required: false
            },
            BOMLevel: {
                type: String,
                required: false
            },
            supplier: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: "Supplier"
            },
            supplierName: {
                type: String,
                required: false
            },
            unitCost: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            BOMCostTotal: {
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

    RoutingCostBreakdown: [
        {
            operationName: {
                type: String,
                required: false
            },
            workCenter: {
                type: String,
                required: false
            },
            labourHours: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            machineHours: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            routingCostTotal: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            equipment: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: "Asset"
            }
        }
    ],
    totalBomCost: {
        type: Number,
        set: value => {
            if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                return parseFloat(value).toFixed(2);
            }
        },
        required: false
    },
    totalRoutingCost: {
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
        required: false,
        enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
        default: OPTIONS.defaultStatus.ACTIVE
    },
    SKUCost: {
        type: Number,
        set: value => {
            if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                return parseFloat(value).toFixed(2);
            }
        },
        required: false
    }
};
