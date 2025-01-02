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
    scheduleCode: {
        type: String,
        required: false
    },
    maintenanceTask: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "MaintenanceTask"
    },
    scheduleDate: {
        type: Date,
        required: false
    },
    equipmentName: {
        type: String,
        required: false
    },
    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "Asset"
    },
    // equipment: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     required: false,
    //     ref: "Equipment"
    // },
    frequency: {
        type: String,
        required: false
    },
    priority: {
        type: String,
        required: false
    },
    startDate: {
        type: Date,
        required: false
    },
    endDate: {
        type: Date,
        required: false
    },
    status: {
        type: String,
        required: false,
        enum: OPTIONS.defaultStatus.getAllTaskScheduledStatusAsArray(),
        default: OPTIONS.defaultStatus.SCHEDULED
    }
};
