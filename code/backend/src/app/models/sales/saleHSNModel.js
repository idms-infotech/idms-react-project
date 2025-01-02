const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {SALES_HSN: SCHEMA_CONST} = require("../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const saleHSNSchema = new mongoose.Schema(
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
            required: true,
            default: "Goods"
        },
        // auto-incremented by us
        hsnMasterEntryNo: {
            type: String,
            required: false
        },
        hsnEntryDate: {
            type: String,
            required: false,
            default: new Date()
        },
        // enter tax no
        hsnCode: {
            type: String,
            required: true
        },
        isActive: {
            type: String,
            required: true,
            enum: ["Y", "N"],
            default: "Y"
        },
        goodsDescription: {
            type: String,
            required: true
        },
        gstRate: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: true
        },
        igstRate: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: true
        },
        sgstRate: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: true
        },
        cgstRate: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: true
        },
        ugstRate: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: true
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
saleHSNSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.hsnMasterEntryNo = await getAndSetAutoIncrementNo(SCHEMA_CONST.AUTO_INCREMENT_DATA(), this.company, true);
    }
    if (this.revisionHistory.length == 0) {
        this.revisionHistory.push({
            provisionType: this.provisionType,
            hsnMasterEntryNo: this.hsnMasterEntryNo,
            hsnEntryDate: this.hsnEntryDate,
            hsnCode: this.hsnCode,
            isActive: this.isActive,
            goodsDescription: this.goodsDescription,
            gstRate: this.gstRate,
            igstRate: this.igstRate,
            sgstRate: this.sgstRate,
            cgstRate: this.cgstRate,
            ugstRate: this.ugstRate,
            revisionInfo: this.revisionInfo
        });
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
saleHSNSchema.index({isActive: -1});
saleHSNSchema.plugin(paginatePlugin);
const SaleHSN = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, saleHSNSchema);

module.exports = SaleHSN;
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
