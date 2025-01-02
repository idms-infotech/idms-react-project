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
    warrantyCode: {
        type: String,
        required: false
    },
    warrantyName: {
        type: String,
        required: false
    },
    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "Asset"
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "Supplier"
    },
    warrantyType: {
        type: String,
        required: false,
        // enum: ["Product Warranty", "Service Warranty", ""],
        default: "Product Warranty"
    },
    warrantyStartDate: {
        type: Date,
        required: false
    },
    warrantyEndDate: {
        type: Date,
        required: false
    },
    warrantyDescription: {
        type: String,
        required: false
    },
    contactPerson: {
        type: String,
        required: false
    },
    AMCStartDate: {
        type: Date,
        required: false
    },
    AMCEndDate: {
        type: Date,
        required: false
    },
    warrantyStatus: {
        type: String,
        required: false,
        enum: ["Active", "Expired"],
        default: "Active"
    }
};
