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
    workOrderCode: {
        type: String,
        required: false
    },
    workOrderExecutionDate: {
        type: Date,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    schedule: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "TaskScheduling"
    },
    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "Asset"
    },
    equipmentName: {
        type: String,
        required: false
    },
    technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MaintenanceTechnician"
    },
    priority: {
        type: String,
        required: false,
        // enum: ["High", "Medium", "Low", ""],
        default: "High"
    },
    startDate: {
        type: Date,
        required: false
    },
    endDate: {
        type: Date,
        required: false
    },
    materials: {
        type: String,
        required: false
    },
    maintenanceCost: {
        type: Number,
        set: value => {
            if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                return parseFloat(value).toFixed(2);
            }
        },
        required: false
    },
    status: {
        type: String,
        required: false,
        enum: OPTIONS.defaultStatus.getAllWorkOrderGenerationStatusAsArray(),
        default: OPTIONS.defaultStatus.OPEN
    }
};
