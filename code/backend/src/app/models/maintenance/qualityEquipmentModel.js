const mongoose = require("mongoose");
const {findAppParameterValue} = require("../../controllers/v1/settings/appParameter/appParameter");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {QUALITY_EQUIPMENT: SCHEMA_CONST} = require("../../mocks/schemasConstant/maintenanceConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {SCHEMA} = require("./schemas/qualityEquipmentSchema");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const qualityEquipmentSchema = new mongoose.Schema(SCHEMA, {
    timestamps: true,
    versionKey: false,
    collection: SCHEMA_CONST.COLLECTION_NAME
});

qualityEquipmentSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.equipmentCode = await getAndSetAutoIncrementNo(
            {...SCHEMA_CONST.AUTO_INCREMENT_DATA()},
            this.company,
            true
        );
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
qualityEquipmentSchema.index({status: -1});
qualityEquipmentSchema.index({calibrationDate: -1});
qualityEquipmentSchema.plugin(paginatePlugin);
const QualityEquipment = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, qualityEquipmentSchema);

module.exports = QualityEquipment;
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
