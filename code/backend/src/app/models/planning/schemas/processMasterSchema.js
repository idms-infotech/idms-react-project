const {default: mongoose} = require("mongoose");

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
    processId: {
        type: String,
        required: false
    },
    processName: {
        type: String,
        required: false
    },
    unitProcessOutput: {
        type: String,
        required: false
    },
    standardOutputPerHr: {
        type: Number,
        required: false
    },
    allocationOfSkilledLabour: {
        type: Number,
        required: false
    },
    allocationOfSemiSkilledLabour: {
        type: Number,
        required: false
    },
    allocationOfUnSkilledLabour: {
        type: Number,
        required: false
    },
    totalLabourHeadCount: {
        type: Number,
        required: false
    },
    assetAllocationDetails: [
        {
            asset: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: "Asset"
            },
            assetCode: {
                type: String,
                required: false
            },
            assetName: {
                type: String,
                required: false
            },
            assetDescription: {
                type: String,
                required: false
            },
            location: {
                type: String,
                required: false
            },
            totalAssetCostPerHr: {
                type: Number,
                required: false
            },
            isSelect: {
                type: Boolean,
                required: false,
                default: false
            }
        }
    ],
    totalAllocatedAssetCostPerHr: {
        type: Number,
        required: false
    },
    labourRatePerHr: {
        type: Number,
        set: value => {
            const parsedValue = parseFloat(value);
            if (!isNaN(parsedValue)) {
                return parsedValue.toFixed(2);
            }
        },
        required: false
    }
};
