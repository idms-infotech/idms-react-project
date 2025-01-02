const mongoose = require("mongoose");
const {CONSTANTS} = require("../../../config/config");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {MENU_ITEM: SCHEMA_CONST} = require("../../mocks/schemasConstant/settingsConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const menuItem = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Company"
        },
        system: {
            type: String,
            required: true,
            enum: ["main", "esmp"],
            default: "main"
        },
        title: {
            type: String,
            required: true
        },
        path: {
            type: String,
            required: true
        },
        activeClass: {
            type: String,
            required: false
        },
        isMenuActive: {
            type: Boolean,
            required: false
        },
        menuOrder: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: true
        },
        image: {
            type: String,
            required: false
        },
        color: {
            type: String,
            required: false
        },
        isActive: {
            type: String,
            required: false
        },
        roles: [
            {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: "Role"
            }
        ]
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

menuItem.set("toJSON", {virtuals: true});

menuItem.virtual("imageUrl").get(function () {
    if (this.image && this.image != "undefined") {
        return CONSTANTS.domainUrl + "menuImage/" + this.image;
    }
});
menuItem.plugin(paginatePlugin);
menuItem.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

module.exports = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, menuItem);

const auditTrail = async (master, modifiedPaths, isNew, isModified) => {
    const {createdBy, updatedBy, company} = master;
    const auditTrail = {
        company: company,
        oldData: JSON.stringify(await master.constructor.findById(master._id)),
        data: JSON.stringify(master),
        user: isNew ? createdBy : updatedBy,
        action: isNew ? SCHEMA_CONST.ADDED_ACTION : SCHEMA_CONST.UPDATED_ACTION,
        fieldsModified: modifiedPaths.toString()
    };
    await Audit.auditModule(auditTrail);
};
