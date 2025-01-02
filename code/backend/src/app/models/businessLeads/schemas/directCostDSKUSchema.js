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
    directCostNo: {
        type: String,
        required: false
    },
    productCategory: {
        type: String,
        required: false
    },
    DSKU: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
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
    UOM: {
        type: String,
        required: false
    },
    totalLabourCostPerUnit: {
        type: Number,
        set: value => {
            if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                return parseFloat(value).toFixed(2);
            }
        },
        required: false
    },
    totalAssetCostPerUnit: {
        type: Number,
        set: value => {
            if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                return parseFloat(value).toFixed(2);
            }
        },
        required: false
    },
    totalToolingCostPerUnit: {
        type: Number,
        set: value => {
            if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                return parseFloat(value).toFixed(2);
            }
        },
        required: false
    },
    totalCostPerUnit: {
        type: Number,
        set: value => {
            if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                return parseFloat(value).toFixed(2);
            }
        },
        required: false
    },

    directCostDetails: [
        {
            process: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: "ProcessMaster"
            },
            PFSeq: {
                type: String,
                required: false
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
            specQuantity: {
                type: Number,
                required: false
            },
            outputPerHr: {
                type: Number,
                required: false
            },
            processHrs: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            //  labour
            labourRatePerHr: {
                type: Number,
                required: false
            },
            labourCost: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            CAUnits: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            labourCostPerUnit: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            // assets
            assetRatePerHr: {
                type: Number,
                required: false
            },
            assetCost: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            CAUnits: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            assetCostPerUnit: {
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
    toolingCostDetails: [
        {
            srNo: {
                type: String,
                required: false
            },
            toolingDescription: {
                type: String,
                required: false
            },
            toolingCost: {
                type: Number,
                required: false
            },
            CAUnits: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            toolingCostPerUnit: {
                type: Number,
                required: false
            }
        }
    ]
};
