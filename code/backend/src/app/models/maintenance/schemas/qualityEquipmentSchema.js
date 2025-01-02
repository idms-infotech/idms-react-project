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
    equipmentCode: {
        type: String,
        required: false
    },
    equipmentName: {
        type: String,
        required: false
    },
    equipmentType: {
        type: String,
        required: false
    },
    manufacturer: {
        type: String,
        required: false
    },
    modelNumber: {
        type: String,
        required: true
    },
    serialNumber: {
        type: String,
        required: false
    },
    calibrationDate: {
        type: Date,
        required: false
    },
    calibrationDue: {
        type: Date,
        required: false
    },
    calibrationAgency: {
        type: String,
        required: false
    },
    location: {
        type: String,
        required: false
    },
    empDepartments: {
        type: String,
        required: false
    },
    status: {
        type: String,
        required: false,
        enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
        default: OPTIONS.defaultStatus.ACTIVE
    }
};
