const mongoose = require("mongoose");
const {findAppParameterValue} = require("../../controllers/v1/settings/appParameter/appParameter");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {CONSTANTS} = require("../../../config/config");
const {TRAVEL_REQUEST: SCHEMA_CONST} = require("../../mocks/schemasConstant/accountsConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const travelRequestSchema = new mongoose.Schema(
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
        travelCode: {
            type: String,
            required: true
        },
        requestDate: {
            type: Date,
            required: false,
            default: new Date()
        },
        travelForm: {
            type: String,
            required: true
        },
        travelDestination: {
            type: String,
            required: true
        },
        travelStartDate: {
            type: Date,
            required: true,
            default: new Date()
        },
        travelEndDate: {
            type: Date,
            required: true,
            default: new Date()
        },
        purposeOfTravel: {
            type: String,
            required: true
        },
        modeOfTransportation: {
            type: String,
            required: false
        },
        estimatedBudget: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: true
        },
        costAllocation: {
            type: String,
            required: false
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Customer"
        },
        paymentMethod: {
            type: String,
            required: false
        },
        raisedBy: {
            type: String,
            required: true
        },
        supportingDocumentsFile: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
travelRequestSchema.set("toJSON", {virtuals: true});

travelRequestSchema.virtual("supportingDocumentsFileUrl").get(function () {
    if (this.supportingDocumentsFile && this.supportingDocumentsFile != "undefined") {
        return CONSTANTS.domainUrl + "travelRequest/" + this.supportingDocumentsFile;
    }
});
travelRequestSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.expenseCode = await getAndSetAutoIncrementNo({...SCHEMA_CONST.AUTO_INCREMENT_DATA()}, this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
travelRequestSchema.plugin(paginatePlugin);
const TravelRequest = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, travelRequestSchema);

module.exports = TravelRequest;
const auditTrail = async (master, modifiedPaths, isNew, isModified) => {
    const {createdBy, updatedBy, company} = master;
    const auditTrail = {
        company: company,
        oldData: JSON.stringify(await master.constructor.findById(master._id)),
        data: JSON.stringify(master),
        user: isNew ? createdBy : updatedBy,
        action: isNew ? SCHEMA_CONST.ADDED_ACTION : SCHEMA_CONST.UPDATED_ACTION,
        fieldsModified: modifiedPaths.toString()
    };
    await Audit.auditModule(auditTrail);
};
