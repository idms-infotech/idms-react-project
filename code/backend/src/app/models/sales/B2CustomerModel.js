const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {B2C_CUSTOMER: SCHEMA_CONST} = require("../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const B2CustomerSchema = new mongoose.Schema(
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
        B2CCode: {
            type: String,
            required: true
        },
        customerName: {
            type: String,
            required: true
        },
        emailId: {
            type: String,
            required: false
        },
        mobileNo: {
            type: String,
            required: true
        },
        isActive: {
            type: Boolean,
            required: true
        },
        stateOfSupply: {
            type: String,
            required: true
        },
        line1: {
            type: String,
            required: false
        },
        line2: {
            type: String,
            required: false
        },
        state: {
            type: String,
            required: false
        },
        district: {
            type: String,
            required: false
        },
        pinCode: {
            type: String,
            required: false
        },
        country: {
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

B2CustomerSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.B2CCode = await getAndSetAutoIncrementNo(SCHEMA_CONST.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
B2CustomerSchema.index({isActive: -1});
B2CustomerSchema.plugin(paginatePlugin);
const B2Customer = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, B2CustomerSchema);

module.exports = B2Customer;
const auditTrail = async (master, modifiedPaths, isNew, isModified) => {
    const {createdBy, updatedBy, company} = master;
    const auditTrail = {
        company: company,
        oldData: JSON.stringify(await master.constructor.findById(master._id)),
        data: JSON.stringify(master),
        user: isNew ? createdBy : updatedBy, // Replace with the actual current user's name
        action: isNew ? SCHEMA_CONST.ADDED_ACTION : SCHEMA_CONST.COLLECTION_NAME,
        fieldsModified: modifiedPaths.toString()
    };
    await Audit.auditModule(auditTrail);
};
