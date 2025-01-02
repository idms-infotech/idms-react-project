const {default: mongoose} = require("mongoose");
const {COMPANY, USER} = require("../../mocks/schemasConstant/settingsConstant");
const {setTwoDecimal} = require("../../helpers/utility");

exports.COMMON_SCHEMA = {
    company: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: COMPANY.COLLECTION_NAME
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: USER.COLLECTION_NAME
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: USER.COLLECTION_NAME
    }
};

exports.OTHER_CHARGES = {
    packagingAndForwarding: {
        type: Number,
        set: value => setTwoDecimal(value),
        required: false,
        default: 0
    },
    freight: {
        type: Number,
        set: value => setTwoDecimal(value),
        required: false,
        default: 0
    },
    insurance: {
        type: Number,
        set: value => setTwoDecimal(value),
        required: false,
        default: 0
    },
    loadingAndUnloading: {
        type: Number,
        set: value => setTwoDecimal(value),
        required: false,
        default: 0
    },
    miscellaneous: {
        type: Number,
        set: value => setTwoDecimal(value),
        required: false,
        default: 0
    },
    totalAmount: {
        type: Number,
        set: value => setTwoDecimal(value),
        required: false,
        default: 0
    }
};

exports.ADDRESS = [
    {
        line1: {
            type: String,
            required: false
        },
        line2: {
            type: String,
            required: false
        },
        line3: {
            type: String,
            required: false
        },
        line4: {
            type: String,
            required: false
        },
        state: {
            type: String,
            required: false
        },
        city: {
            type: String,
            required: false
        },
        district: {
            type: String,
            required: false
        },
        pinCode: {
            type: String,
            required: false
        },
        country: {
            type: String,
            required: false
        }
    }
];
exports.BANK_DETAILS = [
    {
        befName: {
            type: String,
            required: false
        },
        bankName: {
            type: String,
            required: false
        },
        accountNumber: {
            type: String,
            required: false
        },
        accountType: {
            type: String,
            required: false
        },
        bankIFSCCode: {
            type: String,
            required: false
        },
        bankSwiftCode: {
            type: String,
            required: false
        }
    }
];
