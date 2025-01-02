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
    prospectRegistrationCode: {
        type: String,
        required: false
    },
    prospectRegistrationDate: {
        type: Date,
        required: false
    },
    prospectName: {
        type: String,
        required: false
    },
    customerCategory: {
        type: String,
        required: false
    },
    currency: {
        type: String,
        required: false
    },
    correspondenceAddress: {
        line1: {
            type: String,
            required: false,
            trim: true
        },
        line2: {
            type: String,
            required: false,
            trim: true
        },
        line3: {
            type: String,
            required: false,
            trim: true
        },
        line4: {
            type: String,
            required: false,
            trim: true
        },
        state: {
            type: String,
            required: false,
            trim: true
        },
        city: {
            type: String,
            required: false,
            trim: true
        },
        pinCode: {
            type: String,
            required: false,
            trim: true
        },
        country: {
            type: String,
            required: false,
            trim: true
        }
    },
    contactDetails: [
        {
            contactPersonName: {
                type: String,
                required: false
            },
            contactPersonDepartment: {
                type: String,
                required: false,
                default: "Others"
            },
            contactPersonDesignation: {
                type: String,
                required: false
            },
            contactPersonNumber: {
                type: String,
                required: false
            },
            contactPersonEmail: {
                type: String,
                required: false
            }
        }
    ],
    status: {
        type: String,
        required: false,
        //  enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
        default: OPTIONS.defaultStatus.ACTIVE
    }
};
