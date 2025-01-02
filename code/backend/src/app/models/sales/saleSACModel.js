const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {SALES_SAC: SCHEMA_CONST} = require("../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const saleSACSchema = new mongoose.Schema(
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
        provisionType: {
            type: String,
            required: false,
            default: "Service"
        },
        isActive: {
            type: String,
            required: true,
            enum: ["Y", "N"],
            default: "Y"
        },
        sacCode: {
            type: String,
            required: true
        },
        serviceDescription: {
            type: String,
            required: false
        },
        gstRate: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: true
        },
        igstRate: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: true
        },
        sgstRate: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: true
        },
        cgstRate: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: true
        },
        ugstRate: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: true
        },
        sacMasterEntryNo: {
            type: String,
            required: false
        },
        sacEntryDate: {
            type: Date,
            required: false
        },
        revisionInfo: {
            revisionNo: {
                type: String,
                required: false
            },
            revisionDate: {
                type: Date,
                required: false
            },
            reasonForRevision: {
                type: String,
                required: false
            },
            revisionProposedBy: {
                type: String,
                required: false
            },
            revisionApprovedBy: {
                type: String,
                required: false
            }
        },
        revisionHistory: []
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

saleSACSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.sacMasterEntryNo = await getAndSetAutoIncrementNo(SCHEMA_CONST.AUTO_INCREMENT_DATA(), this.company, true);
    }
    if (this.revisionHistory.length == 0) {
        this.revisionHistory.push({
            provisionType: this.provisionType,
            isActive: this.isActive,
            sacCode: this.sacCode,
            serviceDescription: this.serviceDescription,
            gstRate: this.gstRate,
            igstRate: this.igstRate,
            sgstRate: this.sgstRate,
            cgstRate: this.cgstRate,
            ugstRate: this.ugstRate,
            sacMasterEntryNo: this.sacMasterEntryNo,
            sacEntryDate: this.sacEntryDate,
            revisionInfo: this.revisionInfo
        });
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
saleSACSchema.index({isActive: -1});
saleSACSchema.plugin(paginatePlugin);
const SaleSAC = mongoose.model("SaleSAC", saleSACSchema);

module.exports = SaleSAC;
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

// const renameCollection = async ()=>{
//     await mongoose.connection.collection("salesacs").rename("SaleSAC");
// }
