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
    MRN: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "MRN"
    },
    MRNNumber: {
        type: String,
        required: false
    },
    GIN: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "GoodInwardEntry"
    },
    GINDate: {
        type: Date,
        required: false
    },
    item: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "Items"
    },
    itemCode: {
        type: String,
        required: false
    },
    itemType: {
        type: String,
        required: false
    },
    itemName: {
        type: String,
        required: false
    },
    itemDescription: {
        type: String,
        required: false
    },
    shelfLife: {
        type: Number,
        set: value => {
            if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                return parseFloat(value).toFixed(2);
            }
        },
        required: false
    },
    unitConversion: {
        type: String,
        required: false
    },
    UOM: {
        type: String,
        required: false
    },
    PPICQty: {
        type: Number,
        set: value => {
            if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                return parseFloat(value).toFixed(2);
            }
        },
        required: false
    },
    productionRemarks: {
        prodRemarks: {
            type: String,
            required: false
        },
        checkedBy: {
            type: String,
            required: false
        },
        approvedBy: {
            type: String,
            required: false
        },
        approvedDate: {
            type: Date,
            required: false
        }
    },
    QARemarks: {
        QARemark: {
            type: String,
            required: false
        },
        checkedBy: {
            type: String,
            required: false
        },
        approvedBy: {
            type: String,
            required: false
        },
        approvedDate: {
            type: Date,
            required: false
        }
    }
};
