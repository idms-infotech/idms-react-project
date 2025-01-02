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
    taskCode: {
        type: String,
        required: false
    },
    taskName: {
        type: String,
        required: false
    },
    taskDescription: {
        type: String,
        required: false
    },
    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "Asset"
    },
    priority: {
        type: String,
        required: false,
        // enum: ["Low", "Medium", "High"],
        default: "Low"
    },
    frequency: {
        type: String,
        required: false,
        // enum: ["Daily", "Weekly", "Monthly", "Yearly"],
        default: "Weekly"
    },
    estimatedTime: {
        type: String,
        required: false
    },
    taskCategory: {
        type: String,
        required: false,
        // enum: ["Preventive", "Predictive"],
        default: "Preventive"
    },
    maintenanceChecklist: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "MaintenanceChecklist"
    },
    taskStatus: {
        type: String,
        required: false,
        enum: ["Open", "In Progress", "Completed", "On Hold", "Cancelled"],
        default: "Open"
    }
};
