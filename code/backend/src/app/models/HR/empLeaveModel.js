const mongoose = require("mongoose");
const {EMPLOYEE_LEAVE: SCHEMA_CONST} = require("../../mocks/schemasConstant/HRConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const empLeaveSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Company"
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Employee"
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Employee"
        },
        empId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Employee"
        },
        approverId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Employee"
        },
        empLeaveCode: {
            type: String,
            required: true,
            default: "EL0001"
        },
        totalLeave: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: true
        },
        remainingLeave: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        leaveUsed: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        previousYearLeave: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        presentYear: {
            type: String,
            required: false
        },
        leaveHistory: [
            {
                index: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                leaveType: {
                    type: String,
                    required: true
                },
                isHalfDay: {
                    type: String,
                    required: false
                },
                fromDate: {
                    type: Date,
                    required: true
                },
                toDate: {
                    type: Date,
                    required: true
                },
                totalNoOfDays: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: true
                },
                balanceLeave: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                leaveReason: {
                    type: String,
                    required: true
                },
                leaveFileUpload: {
                    type: String,
                    required: false
                },
                approvalReason: {
                    type: String,
                    required: false
                },
                leaveStatus: {
                    type: String,
                    required: true
                },
                currentYear: {
                    type: String,
                    required: false
                }
            }
        ]
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
empLeaveSchema.plugin(paginatePlugin);

const EmpLeave = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, empLeaveSchema);

module.exports = EmpLeave;
