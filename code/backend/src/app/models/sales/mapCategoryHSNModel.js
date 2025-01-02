const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {OPTIONS} = require("../../helpers/global.options");
const {MAP_CATEGORY_HSN: SCHEMA_CONST} = require("../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const mapCategoryHSNSchema = new mongoose.Schema(
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
        hsnMapCategoryCode: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
            default: OPTIONS.defaultStatus.ACTIVE
        },
        productCategory: {
            type: String,
            required: false
        },
        HSN: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "HSN"
        },
        HSNCode: {
            type: String,
            required: false
        },
        colourName: {
            type: String,
            required: false
        },
        description: {
            type: String,
            required: false
        },
        igstRate: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        sgstRate: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        cgstRate: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        ugstRate: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
mapCategoryHSNSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.hsnMapCategoryCode = await getAndSetAutoIncrementNo(
            SCHEMA_CONST.AUTO_INCREMENT_DATA(),
            this.company,
            true
        );
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
mapCategoryHSNSchema.index({status: -1});
mapCategoryHSNSchema.plugin(paginatePlugin);
const MapCategoryHSN = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, mapCategoryHSNSchema);

module.exports = MapCategoryHSN;
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
