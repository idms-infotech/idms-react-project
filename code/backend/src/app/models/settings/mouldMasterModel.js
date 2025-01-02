const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {MOULD_MASTER: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/settingsConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const {OPTIONS} = require("../../helpers/global.options");
const mouldMasterSchema = new mongoose.Schema(
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
        mouldNo: {
            type: String,
            required: false
        },
        mouldType: {
            type: String,
            required: false
        },
        mouldName: {
            type: String,
            required: false
        },
        noOfCavities: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        mouldTBDDimension: {
            type: String,
            required: false
        },
        // TBDPerWidth: {
        //     type: Number,
        //     set: value => setTwoDecimal(value),
        //     required: false
        // },
        // TBDPerLength: {
        //     type: Number,
        //     set: value => setTwoDecimal(value),
        //     required: false
        // },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Supplier"
        },
        mouldSupplier: {
            type: String,
            required: false
        },
        partNo: {
            type: String,
            required: false
        },
        mouldBatchDate: {
            type: Date,
            required: false,
            default: new Date()
        },
        status: {
            type: String,
            required: false,
            default: OPTIONS.defaultStatus.ACTIVE
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

mouldMasterSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.mouldNo = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
mouldMasterSchema.plugin(paginatePlugin);
const mouldMaster = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, mouldMasterSchema);

module.exports = mouldMaster;
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
