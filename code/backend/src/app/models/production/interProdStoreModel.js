const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {INTER_PROD_STORE: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/productionConstant");
const {paginatePlugin, reportPaginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const interProdStoreSchema = new mongoose.Schema(
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
        item: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "ProductionItem"
        },
        batchCardEntry: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "BatchCardEntry"
        },
        prodUnitId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "ProductionUnitConfig"
        },
        invZone: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "InvZoneConfig"
        },
        itemCode: {
            type: String,
            required: false
        },
        itemName: {
            type: String,
            required: false
        },
        itemDescription: {
            type: String,
            required: false
        },
        UOM: {
            type: String,
            required: false
        },
        qty: {
            type: Number,
            required: false,
            set: value => setTwoDecimal(value)
        },
        unitRate: {
            type: Number,
            required: false,
            set: value => setTwoDecimal(value)
        },
        value: {
            type: Number,
            required: false,
            set: value => setTwoDecimal(value)
        },
        batchDate: {
            type: Date,
            required: false
        },
        expiryDate: {
            type: Date,
            required: false
        },
        invZoneName: {
            type: String,
            required: false
        },
        location: {
            type: String,
            required: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

interProdStoreSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
interProdStoreSchema.plugin(paginatePlugin);
interProdStoreSchema.plugin(reportPaginatePlugin);
const InterProdStore = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, interProdStoreSchema);

module.exports = InterProdStore;
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
