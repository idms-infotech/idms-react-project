const {default: mongoose} = require("mongoose");
const {OPTIONS} = require("../../../helpers/global.options");

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
    processResourceManagementCode: {
        type: String,
        required: false
    },
    processName: {
        type: String,
        required: false
    },
    processCode: {
        type: String,
        required: false
    },
    process: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "ProcessNameMaster"
    },
    machineName: {
        type: String,
        required: false
    },
    machineCode: {
        type: String,
        required: false
    },
    machine: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "Asset"
    },
    outputPerHr: {
        type: Number,
        required: false
    },
    noOfManpower: {
        type: Number,
        required: false
    },
    labourCostPerHr: {
        type: Number,
        required: false
    },
    powerConsumptionPerHr: {
        type: Number,
        required: false
    },
    status: {
        type: String,
        required: false,
        enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
        default: OPTIONS.defaultStatus.ACTIVE
    }
};
