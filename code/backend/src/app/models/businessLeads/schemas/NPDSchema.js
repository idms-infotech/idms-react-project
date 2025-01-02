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
    NPDNo: {
        type: String,
        required: false
    },
    NPDDate: {
        type: Date,
        required: false,
        default: new Date()
    },
    name: {
        type: String,
        required: false
    },
    reference: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "referenceModel"
    },
    referenceModel: {
        type: String,
        enum: ["Customer", "Prospect"]
    },
    productCategory: {
        type: String,
        required: false
    },
    projectName: {
        type: String,
        required: false
    },
    productBrief: {
        type: String,
        required: false
    },
    buildStage: {
        type: String,
        required: false
    },
    orderType: {
        type: String,
        required: false
    },
    monthlyOffTakeQty: {
        type: Number,
        required: false
    },
    annualOffTakeQty: {
        type: Number,
        required: false
    },
    expProductionStartDate: {
        type: Date,
        required: false
    },
    developmentCharges: {
        type: String,
        required: false
    },
    requestedQty: {
        type: Number,
        set: value => {
            if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                return parseFloat(value).toFixed(2);
            }
        },
        required: false
    },
    expectedDeliveryDate: {
        type: Date,
        required: false
    },
    validationRequired: {
        type: String,
        required: false
    },
    NPDRequestedBy: {
        type: String,
        required: false
    },
    remarks: {
        type: String,
        required: false
    },
    noOfVariants: {
        type: Number,
        required: false
    },
    variantsInfo: [
        {
            variant: {
                type: Number,
                required: false
            },
            variantName: {
                type: String,
                required: false
            },
            partNo: {
                type: String,
                required: false
            },
            drawingNo: {
                type: String,
                required: false
            }
        }
    ],
    engineeringDrawing: {
        type: String,
        required: false
    },
    productSpecification: {
        type: String,
        required: false
    },
    designMockUpFile: {
        type: String,
        required: false
    },
    artworkForProcessingFile: {
        type: String,
        required: false
    },
    customerInputsChecklist: [
        {
            inputCheckListParticular: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: "ChecklistParticulars"
            },
            isChecked: {
                type: Boolean,
                required: false,
                default: false
            }
        }
    ],
    status: {
        type: String,
        required: false,
        default: OPTIONS.defaultStatus.AWAITING_REVIEW,
        // enum: ["Awaiting Review", "Review Started", "Closed", "Put On Hold", "Terminate"],
        enum: OPTIONS.defaultStatus.getAllNPDStatusAsArray()
    }
};
