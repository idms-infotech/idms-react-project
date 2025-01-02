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
    DSKUCostSheetNo: {
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
    sellingPrice: {
        type: Number,
        set: value => {
            if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                return parseFloat(value).toFixed(2);
            }
        },
        required: false
    },
    DSKUCostDetails: [
        {
            srNo: {
                type: String,
                required: false
            },
            costHead: {
                type: String,
                required: false
            },
            costPerUnit: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            percentage: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            }
        }
    ]
};
