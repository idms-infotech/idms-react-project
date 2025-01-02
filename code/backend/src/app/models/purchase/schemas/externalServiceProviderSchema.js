const { default: mongoose } = require("mongoose");
const {OPTIONS} = require("../../../helpers/global.options");
const {ADDRESS, BANK_DETAILS} = require("../../commonSchemas/commonSchemas");
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
    ESPCategory: {
        type: String,
        required: false
    },
    ESPCode: {
        type: String,
        required: true
    },
    ESPName: {
        type: String,
        required: true
    },
    ESPNickName: {
        type: String,
        required: false
    },
    PANNo: {
        type: String,
        required: true
    },
    GSTClassification: {
        type: String,
        required: false
    },
    GSTIN: {
        type: String,
        required: true
    },
    udyamAadhaarNo: {
        type: String,
        required: false
    },
    MSMEClassification: {
        type: String,
        required: false
    },
    currency: {
        type: String,
        required: false,
        default: "INR"
    },
    paymentTerms: {
        type: String,
        required: false
    },
    isESPActive: {
        type: String,
        required: false,
        enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
        default: OPTIONS.defaultStatus.ACTIVE
    },
    billingAddress: ADDRESS,
    shippingAddress: ADDRESS,
    contactMatrix: [
        {
            contactPersonName: {
                type: String,
                required: true
            },
            contactPersonDesignation: {
                type: String,
                required: false
            },
            contactPersonDepartment: {
                type: String,
                required: false,
                default: "Others"
            },
            contactPersonNumber: {
                type: String,
                required: true
            },
            contactPersonAltNum: {
                type: String,
                required: false
            },
            contactPersonEmail: {
                type: String,
                required: false
            },
            telNo: {
                type: String,
                required: false
            }
        }
    ],
    bankDetails: BANK_DETAILS
};
