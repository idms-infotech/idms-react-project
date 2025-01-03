const {default: mongoose} = require("mongoose");
const {OPTIONS} = require("../../../helpers/global.options");

exports.SCHEMA =   {
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
    SKUCostSheetNo: {
        type: String,
        required: false
    },
    productCategory: {
        type: String,
        required: false
    },
    SKU: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "SKUMaster"
    },
    SKUNo: {
        type: String,
        required: false
    },
    SKUName: {
        type: String,
        required: false
    },
    SKUDescription: {
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
    SKUCostDetails: [
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
