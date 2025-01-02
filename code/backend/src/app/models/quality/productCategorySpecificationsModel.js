const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {PRODUCT_CATEGORY_SPECIFICATIONS: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/qualityConstant");
const {SCHEMA} = require("./schemas/productCategorySpecificationsSchema");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const productCategorySpecificationsSchema = new mongoose.Schema(SCHEMA, {
    timestamps: true,
    versionKey: false,
    collection: SCHEMA_CONSTANT.COLLECTION_NAME
});

productCategorySpecificationsSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
productCategorySpecificationsSchema.plugin(paginatePlugin);
const productCategorySpecifications = mongoose.model(
    SCHEMA_CONSTANT.COLLECTION_NAME,
    productCategorySpecificationsSchema
);

module.exports = productCategorySpecifications;
const auditTrail = async (master, modifiedPaths, isNew, isModified) => {
    const {createdBy, updatedBy, company} = master;
    const auditTrail = {
        company: company,
        oldData: JSON.stringify(await master.constructor.findById(master._id)),
        data: JSON.stringify(master),
        user: isNew ? createdBy : updatedBy, // Replace with the actual current user's name
        action: isNew ? SCHEMA_CONSTANT.ADDED_ACTION : SCHEMA_CONSTANT.UPDATED_ACTION,
        fieldsModified: modifiedPaths.toString()
    };
    await Audit.auditModule(auditTrail);
};
