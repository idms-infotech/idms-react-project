const {default: mongoose} = require("mongoose");
const {OPTIONS} = require("../../../helpers/global.options");

exports.SCHEMA = {
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
    category: {
        type: String,
        required: true,
        unique: true
    },
    application: {
        type: String,
        required: false
    },
    subCategory: [
        {
            name: {
                type: String,
                required: false
            },
            prefix: {
                type: String,
                required: false
            },
            subCategoryStatus: {
                type: String,
                required: false,
                enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
                default: OPTIONS.defaultStatus.ACTIVE
            },
            subCategoryAutoIncrement: {
                type: Number,
                required: true
            },
            digit: {
                type: Number,
                required: false,
                default: 4
            }
        }
    ],
    prefix: {
        type: String,
        required: true
    },
    nextAutoIncrement: {
        type: Number,
        required: true
    },
    digit: {
        type: Number,
        required: false,
        default: 4
    },
    categoryStatus: {
        type: String,
        required: false,
        enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
        default: OPTIONS.defaultStatus.ACTIVE
    },
    BOM: {
        type: Boolean,
        required: false,
        default: false
    },
    stockPreparation: {
        type: Boolean,
        required: false,
        default: false
    },
    inkMaster: {
        type: Boolean,
        required: false,
        default: false
    },
    jobWorkItem: {
        type: Boolean,
        required: false,
        default: false
    }
};
