const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {CONSTANTS} = require("../../../config/config");
const {NPD_MASTER: SCHEMA_CONST} = require("../../mocks/schemasConstant/businessLeadsConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {SCHEMA} = require("./schemas/NPDMasterCostSheet");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const NPDMasterSchema = new mongoose.Schema(SCHEMA, {
    timestamps: true,
    versionKey: false,
    collection: SCHEMA_CONST.COLLECTION_NAME
});
NPDMasterSchema.set("toJSON", {virtuals: true});

NPDMasterSchema.virtual("drawingArtWorkFileUrl").get(function () {
    if (this.drawingArtWorkFile && this.drawingArtWorkFile != "undefined") {
        return CONSTANTS.domainUrl + "Sku/" + this.drawingArtWorkFile;
    }
});
NPDMasterSchema.virtual("productionLayoutFileUrl").get(function () {
    if (this.productionLayoutFile && this.productionLayoutFile != "undefined") {
        return CONSTANTS.domainUrl + "Sku/" + this.productionLayoutFile;
    }
});
NPDMasterSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.NPDMasterCode = await getAndSetAutoIncrementNo(SCHEMA_CONST.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

NPDMasterSchema.index({isActive: -1});
NPDMasterSchema.index({isConvertedToSKU: -1});
NPDMasterSchema.plugin(paginatePlugin);
const NPDMaster = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, NPDMasterSchema);

module.exports = NPDMaster;
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
