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
    productCategory: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "ProductCategory"
    },
    productNumber: {
        type: String,
        required: false
    },
    productCode: {
        type: String,
        required: false
    },
    displayProductCategoryName: {
        type: String,
        required: false
    },
    application: {
        type: String,
        required: false
    },
    specificationInfo: [
        {
            seq: {
                type: Number,
                required: false
            },
            specificationCode: {
                type: String,
                required: false
            },
            characteristic: {
                type: String,
                required: false
            },
            UOM: {
                type: String,
                required: false
            },
            testStandard: {
                type: String,
                required: false
            },
            measuringInstrument: {
                type: String,
                required: false
            },
            specValue: {
                type: String,
                required: false
            },
            tolerance: {
                type: Number,
                required: false
            },
            LTL: {
                type: String,
                required: false
            },
            UTL: {
                type: String,
                required: false
            }
        }
    ],
    status: {
        type: String,
        required: false,
        enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
        default: OPTIONS.defaultStatus.ACTIVE
    }
};
