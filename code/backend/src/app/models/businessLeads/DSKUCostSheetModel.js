const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {DSKU_COST_SHEET: SCHEMA_CONST} = require("../../mocks/schemasConstant/businessLeadsConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {SCHEMA} = require("./schemas/DSKUCostSheetSchema");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const DSKUCostSheetSchema = new mongoose.Schema(SCHEMA, {
    timestamps: true,
    versionKey: false,
    collection: SCHEMA_CONST.COLLECTION_NAME
});

DSKUCostSheetSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.DSKUCostSheetNo = await getAndSetAutoIncrementNo(
            {...SCHEMA_CONST.AUTO_INCREMENT_DATA()},
            this.company,
            true
        );
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
DSKUCostSheetSchema.plugin(paginatePlugin);
DSKUCostSheetSchema.index({DSKU: -1});
const DSKUCostSheet = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, DSKUCostSheetSchema);

module.exports = DSKUCostSheet;

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
