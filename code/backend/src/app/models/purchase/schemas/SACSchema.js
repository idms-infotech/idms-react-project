const {default: mongoose} = require("mongoose");

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
    provisionType: {
        type: String,
        required: false,
        default: "Service"
    },
    isActive: {
        type: String,
        required: true,
        enum: ["Y", "N"],
        default: "Y"
    },
    sacCode: {
        type: String,
        required: true
    },
    serviceDescription: {
        type: String,
        required: false
    },
    sacMasterEntryNo: {
        type: String,
        required: false
    },
    sacEntryDate: {
        type: Date,
        required: false
    },
    gstRate: {
        type: Number,
        required: true
    },
    igstRate: {
        type: Number,
        required: true
    },
    sgstRate: {
        type: Number,
        required: true
    },
    cgstRate: {
        type: Number,
        required: true
    },
    ugstRate: {
        type: Number,
        required: true
    },
    revision: [
        {
            revisionNo: {
                type: String,
                required: false
            },
            revisionDate: {
                type: Date,
                required: false
            }
        }
    ]
};
