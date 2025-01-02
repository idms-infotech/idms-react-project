const mongoose = require("mongoose");

const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {ROLE: SCHEMA_CONST} = require("../../mocks/schemasConstant/settingsConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const roleSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Company"
        },
        roleCode: {
            type: String,
            required: false
        },
        roleName: {
            type: String,
            required: true
        },
        displayRoleName: {
            type: String,
            required: false
        },
        redirectTo: {
            type: String,
            required: false
        }
        // permissions: [
        //     {
        //         menuItemId: {
        //             type: mongoose.Schema.Types.ObjectId,
        //             required: true,
        //             ref: "menuItems",
        //         },
        //         businessFunction: {
        //             type: String,
        //             required: true,
        //         },
        //         create: {
        //             type: Boolean,
        //             default: false,
        //         },
        //         edit: {
        //             type: Boolean,
        //             default: false,
        //         },
        //         view: {
        //             type: Boolean,
        //             default: false,
        //         },
        //         approve: {
        //             type: Boolean,
        //             default: false,
        //         },
        //         cancel: {
        //             type: Boolean,
        //             default: false,
        //         },
        //         delete: {
        //             type: Boolean,
        //             default: false,
        //         },
        //         reportGenerated: {
        //             type: Boolean,
        //             default: false,
        //         },
        //         acknowledgment: {
        //             type: Boolean,
        //             default: false,
        //         },
        //         download: {
        //             type: Boolean,
        //             default: false,
        //         },
        //     },
        // ],
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
roleSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.roleCode = await getAndSetAutoIncrementNo(SCHEMA_CONST.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
roleSchema.plugin(paginatePlugin);
const Role = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, roleSchema);

module.exports = Role;
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
