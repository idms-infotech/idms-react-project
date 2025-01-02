const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {PURCHASE_SERVICE_MASTER: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/purchaseConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility"); 
const serviceMasterSchema = new mongoose.Schema(
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
        serviceCode: {
            type: String,
            required: false
        },
        serviceDescription: {
            type: String,
            required: true
        },
        unit: {
            type: String,
            required: false
        },
        sacId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "SAC"
        },
        sacCode: {
            type: String,
            required: false
        },
        isActive: {
            type: String,
            required: true,
            enum: ["Y", "N"],
            default: "Y"
        },
        servicePrice: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        gst: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        igst: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        sgst: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        cgst: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);
serviceMasterSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) { 
        this.serviceCode = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
serviceMasterSchema.index({isActive: -1});
serviceMasterSchema.plugin(paginatePlugin);
const ServiceMaster = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, serviceMasterSchema);

module.exports = ServiceMaster;
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
