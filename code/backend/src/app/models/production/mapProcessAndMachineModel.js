const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {OPTIONS} = require("../../helpers/global.options");
const {MAP_PROCESS_AND_MACHINE: SCHEMA_CONST} = require("../../mocks/schemasConstant/productionConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const mapProcessAndMachineSchema = new mongoose.Schema(
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
        mapCode: {
            type: String,
            required: false
        },
        process: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "ProcessNameMaster"
        },
        processCode: {
            type: String,
            required: false
        },
        processName: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
            default: OPTIONS.defaultStatus.ACTIVE
        },
        machineDetails: [
            {
                machine: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "Asset"
                },
                machineCode: {
                    type: String,
                    required: false
                },
                machineName: {
                    type: String,
                    required: false
                },
                machineDescription: {
                    type: String,
                    required: false
                },
                machineType: {
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

mapProcessAndMachineSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.mapCode = await getAndSetAutoIncrementNo(SCHEMA_CONST.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

mapProcessAndMachineSchema.index({status: -1});
mapProcessAndMachineSchema.plugin(paginatePlugin);
const MapProcessAndMachine = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, mapProcessAndMachineSchema);

module.exports = MapProcessAndMachine;
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
