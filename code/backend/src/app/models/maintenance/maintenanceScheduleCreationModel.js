const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {MAINTENANCE_SCHEDULE: SCHEMA_CONST} = require("../../mocks/schemasConstant/maintenanceConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const maintenanceScheduleSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
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
        scheduleCode: {
            type: String,
            required: false
        },
        scheduleName: {
            type: String,
            required: false
        },
        equipment: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Asset"
        },
        maintenanceTask: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "MaintenanceTask"
        },
        frequency: {
            type: String,
            required: false,
            enum: ["Daily", "Weekly", "Monthly", "Yearly"],
            default: "Daily"
        },
        priority: {
            type: String,
            required: false
            // enum: [
            //     "Daily", "Weekly", "Monthly", "Yearly"
            // ],
            // default: "Daily",
        },
        startDate: {
            type: Date,
            required: false
        },
        endDate: {
            type: Date,
            required: false
        },
        description: {
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

maintenanceScheduleSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.scheduleCode = await getAndSetAutoIncrementNo({...SCHEMA_CONST.AUTO_INCREMENT_DATA()}, this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
maintenanceScheduleSchema.index({startDate: -1});
maintenanceScheduleSchema.plugin(paginatePlugin);
const MaintenanceSchedule = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, maintenanceScheduleSchema);

module.exports = MaintenanceSchedule;
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
