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
    routingCode: {
        type: String,
        required: false
    },
    SKU: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
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
    UOM: {
        type: String,
        required: false
    },
    partCount: {
        type: Number,
        required: false
    },
    routingDetails: [
        {
            operationName: {
                type: String,
                required: false
            },
            process: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: "ProcessNameMaster"
            },
            workCenterMachine: {
                type: String,
                required: false
            },
            equipment: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: "Asset"
            },
            outputPerHr: {
                type: Number,
                required: false
            },
            labourCostPerHr: {
                type: Number,
                required: false
            },
            powerConsumptionPerHr: {
                type: Number,
                required: false
            },
            machineTime: {
                type: Number,
                required: false
            },
            labourCost: {
                type: Number,
                required: false
            },
            powerConsumptionCost: {
                type: Number,
                required: false
            },
            setupCost: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            overheadCost: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            totalCost: {
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
    totalRoutingCost: {
        type: Number,
        required: false
    },
    status: {
        type: String,
        required: false,
        enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
        default: OPTIONS.defaultStatus.ACTIVE
    }
};
