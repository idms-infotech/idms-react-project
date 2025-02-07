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
    productNo: {
        type: String,
        required: false
    },
    productCategory: {
        type: String,
        required: false
    },
    productName: {
        type: String,
        required: true
    },
    productDescription: {
        type: String,
        required: true
    },
    hsn: {
        type: String,
        required: true
    },
    primaryUnit: {
        type: String,
        required: false
    },
    secondaryUnit: {
        type: String,
        required: false
    },
    unitConversionFlag: {
        type: Number,
        required: false
    },
    conversionFactor: {
        type: Number,
        set: value => {
            if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                return parseFloat(value).toFixed(2);
            }
        },
        required: false
    },
    primaryToSecondaryConversion: {
        type: String,
        required: false
    },
    secondaryToPrimaryConversion: {
        type: String,
        required: false
    },
    unitCost: {
        type: Number,
        required: false
    },
    sourceOfMFG: {
        type: String,
        required: false
    },

    shelfLife: {
        type: Number,
        set: value => {
            value = +value;
            if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                return parseFloat(value).toFixed(2);
            }
        },
        required: false
    },
    storageTemp: {
        type: String,
        required: false
    },
    storageHumidity: {
        type: String,
        required: false
    },
    specialStorageInstruction: {
        type: String,
        required: false
    },
    productionRemarks: {
        type: String,
        required: false
    },
    BOMDimensionInfo: {
        unit1: {
            type: String,
            required: false
        },
        unit2: {
            type: String,
            required: false
        },
        width: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        length: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        mSqArea: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                    return parseFloat(value).toFixed(4);
                }
            },
            required: false
        }
    },
    // dualUnitsDimensionsDetails: {
    //     type: {
    //         type: String,
    //         required: false
    //     },
    //     width: {
    //         type: Number,
    //         required: false
    //     },
    //     length: {
    //         type: Number,
    //         required: false
    //     },
    //     widthUnit: {
    //         type: String,
    //         required: false
    //     },
    //     lengthUnit: {
    //         type: String,
    //         required: false
    //     },
    //     widthInMM: {
    //         type: Number,
    //         required: false
    //     },
    //     lengthInM: {
    //         type: Number,
    //         required: false
    //     },
    //     sqmPerRoll: {
    //         type: Number,
    //         required: false
    //     }
    // },
    status: {
        type: String,
        required: false,
        enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
        default: OPTIONS.defaultStatus.ACTIVE
    }
};
