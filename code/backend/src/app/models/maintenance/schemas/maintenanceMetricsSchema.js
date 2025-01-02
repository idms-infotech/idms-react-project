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
    metricCode: {
        type: String,
        required: false
    },
    metricName: {
        type: String,
        required: false
    },
    metricCategory: {
        type: String,
        required: false
    },
    calculationMethod: {
        type: String,
        required: false
    },
    unitOfMeasure: {
        type: String,
        required: false
    },
    metricDescription: {
        type: String,
        required: false
    },
    targetValue: {
        type: Number,
        set: value => {
            if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                return parseFloat(value).toFixed(2);
            }
        },
        required: false
    },
    thresholds: {
        type: String,
        required: false
    },
    frequency: {
        type: String,
        required: false
    },
    refRangeFrom: {
        type: String,
        required: false
    },
    refRangeTo: {
        type: String,
        required: false
    },
    formula: {
        type: String,
        required: false
    },
    targetDescription: {
        type: String,
        required: false
    },
    lastUpdated: {
        type: String,
        required: false
    },
    metricStatus: {
        type: String,
        required: false,
        enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
        default: OPTIONS.defaultStatus.ACTIVE
    }
};
