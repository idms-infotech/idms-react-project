const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {CONSTANTS} = require("../../../config/config");
const {NPD_REQUEST: SCHEMA_CONST} = require("../../mocks/schemasConstant/businessLeadsConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const NPDSchema = new mongoose.Schema(
    {
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
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
NPDSchema.set("toJSON", {virtuals: true});

NPDSchema.virtual("engineeringDrawingUrl").get(function () {
    if (this.engineeringDrawing && this.engineeringDrawing != "undefined") {
        return CONSTANTS.domainUrl + "NPDRequest/" + this.engineeringDrawing;
    }
});
NPDSchema.virtual("productSpecificationUrl").get(function () {
    if (this.productSpecification && this.productSpecification != "undefined") {
        return CONSTANTS.domainUrl + "NPDRequest/" + this.productSpecification;
    }
});
NPDSchema.virtual("designMockUpFileUrl").get(function () {
    if (this.designMockUpFile && this.designMockUpFile != "undefined") {
        return CONSTANTS.domainUrl + "NPDRequest/" + this.designMockUpFile;
    }
});
NPDSchema.virtual("artworkForProcessingFileUrl").get(function () {
    if (this.artworkForProcessingFile && this.artworkForProcessingFile != "undefined") {
        return CONSTANTS.domainUrl + "NPDRequest/" + this.artworkForProcessingFile;
    }
});
NPDSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.NPDNo = await getAndSetAutoIncrementNo({...SCHEMA_CONST.AUTO_INCREMENT_DATA()}, this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
NPDSchema.plugin(paginatePlugin);
NPDSchema.index({referenceModel: -1});
NPDSchema.index({status: -1});
NPDSchema.index({NPDDate: -1});
const NPD = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, NPDSchema);

module.exports = NPD;
const auditTrail = async (master, modifiedPaths, isNew, isModified) => {
    const {createdBy, updatedBy, company} = master;
    const auditTrail = {
        company: company,
        oldData: JSON.stringify(await master.constructor.findById(master._id)),
        data: JSON.stringify(master),
        user: isNew ? createdBy : updatedBy, // Replace with the actual current user's name
        action: isNew ? SCHEMA_CONST.ADDED_ACTION : SCHEMA_CONST.UPDATED_ACTION,
        fieldsModified: modifiedPaths.toString()
    };
    await Audit.auditModule(auditTrail);
};
