const mongoose = require("mongoose");
const {findAppParameterValue} = require("../../controllers/v1/settings/appParameter/appParameter");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {OPTIONS} = require("../../helpers/global.options");
const {PROCESS_RESOURCE_MANAGEMENT: SCHEMA_CONST} = require("../../mocks/schemasConstant/planningConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const processResourceManagementSchema = new mongoose.Schema(
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
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

processResourceManagementSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.processResourceManagementCode = await getAndSetAutoIncrementNo(
            {...SCHEMA_CONST.AUTO_INCREMENT_DATA()},
            this.company,
            true
        );
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

processResourceManagementSchema.plugin(paginatePlugin);
const ProcessResourceManagement = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, processResourceManagementSchema);

module.exports = ProcessResourceManagement;
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
