const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {MAINTENANCE_CHECKLIST: SCHEMA_CONST} = require("../../mocks/schemasConstant/maintenanceConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {SCHEMA} = require("./schemas/maintenanceChecklistSchema");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const maintenanceChecklistSchema = new mongoose.Schema(SCHEMA, {
    timestamps: true,
    versionKey: false,
    collection: SCHEMA_CONST.COLLECTION_NAME
});

maintenanceChecklistSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.checklistCode = await getAndSetAutoIncrementNo(
            {...SCHEMA_CONST.AUTO_INCREMENT_DATA()},
            this.company,
            true
        );
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
maintenanceChecklistSchema.index({status: -1});
maintenanceChecklistSchema.plugin(paginatePlugin);
const MaintenanceChecklist = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, maintenanceChecklistSchema);

module.exports = MaintenanceChecklist;
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
