const {default: mongoose} = require("mongoose");

exports.SCHEMA =  {
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
    stockIssueCode: {
        type: String,
        required: false
    },
    issueDate: {
        type: Date,
        required: false,
        default: new Date()
    },
    stage: {
        type: String,
        required: false,
        default: "SFG-Roll"
    },
    department: {
        type: String,
        required: false
    },
    jobCardNo: {
        type: String,
        required: false
    },
    stockIssueDetails: [
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
            item: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: "Items"
            },
            SFGId: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: "SFGStock"
            },
            itemCode: {
                type: String,
                required: false
            },
            itemName: {
                type: String,
                required: false
            },
            stage: {
                type: String,
                required: false
            },
            width: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            length: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            sqmPerRoll: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            sheetQty: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            qty: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            UOM: {
                type: String,
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
            issueQty: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            }
        }
    ],
    status: {
        type: String,
        required: true,
        enum: ["Awaiting Approval", "Approved", "Rejected"],
        default: "Awaiting Approval"
    },
    remarks: {
        type: String,
        required: false
    }
};
