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
    stockTransferCode: {
        type: String,
        required: false
    },
    stockTransferDate: {
        type: Date,
        required: false,
        default: new Date()
    },
    itemCategory: {
        type: String,
        required: false
    },
    department: {
        type: String,
        required: false
    },
    remarks: {
        type: String,
        required: false
    },
    stockTransferDetails: [
        {
            MRN: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: "MRN"
            },
            MRNNumber: {
                type: String,
                required: false
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
            WIPId: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: "WIPInventory"
            },
            itemCode: {
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
            unitConversion: {
                type: String,
                required: false
            },
            UOM: {
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
            PPICIRQty: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            transferQty: {
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
