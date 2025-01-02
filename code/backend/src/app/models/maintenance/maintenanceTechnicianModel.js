const mongoose = require("mongoose");
const {findAppParameterValue} = require("../../controllers/v1/settings/appParameter/appParameter");

const Audit = require("../../controllers/v1/settings/audit/audit");
const {MAINTENANCE_TECHNICIAN: SCHEMA_CONST} = require("../../mocks/schemasConstant/maintenanceConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {SCHEMA} = require("./schemas/maintenanceTechnicianSchema");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const maintenanceTechnicianSchema = new mongoose.Schema(SCHEMA, {
    timestamps: true,
    versionKey: false,
    collection: SCHEMA_CONST.COLLECTION_NAME
});

maintenanceTechnicianSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.technicianCode = await getAndSetAutoIncrementNo(
            {...SCHEMA_CONST.AUTO_INCREMENT_DATA()},
            this.company,
            true
        );
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
maintenanceTechnicianSchema.index({technicianStatus: -1});
maintenanceTechnicianSchema.plugin(paginatePlugin);
const MaintenanceTechnician = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, maintenanceTechnicianSchema);

module.exports = MaintenanceTechnician;
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
