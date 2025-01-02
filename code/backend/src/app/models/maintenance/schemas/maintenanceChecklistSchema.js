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
    checklistCode: {
        type: String,
        required: true
    },
    checklistName: {
        type: String,
        required: true
    },
    checklistDescription: {
        type: String,
        required: true
    },
    checklistCategory: {
        type: String,
        required: true
    },
    checklistNotes: {
        type: String,
        required: false
    },
    status: {
        type: String,
        required: true,
        enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
        default: OPTIONS.defaultStatus.ACTIVE
    },
    checklistInstruction: [
        {
            srNo: {
                type: String,
                required: false
            },
            description: {
                type: String,
                required: false
            }
        }
    ]
};
