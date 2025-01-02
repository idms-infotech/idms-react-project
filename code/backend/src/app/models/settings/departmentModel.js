const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {OPTIONS} = require("../../helpers/global.options");
const {DEPARTMENT: SCHEMA_CONST} = require("../../mocks/schemasConstant/settingsConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const departmentSchema = new mongoose.Schema(
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
        departmentCode: {
            type: String,
            required: false
        },
        departmentName: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: false
        },
        departmentHead: {
            type: String,
            required: false
        },
        email: {
            type: String,
            required: false
        },
        officeLocation: {
            type: String,
            required: false
        },
        totalEmployee: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        contactNo: {
            type: String,
            required: false
        },
        goodsTransferRequest: {
            type: Boolean,
            required: false,
            default: false
        },
        subDepartments: [
            {
                subDepartmentName: {
                    type: String,
                    required: false
                },
                contactPersonName: {
                    type: String,
                    required: false
                },
                status: {
                    type: String,
                    required: false,
                    enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
                    default: OPTIONS.defaultStatus.ACTIVE
                }
            }
        ]
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
departmentSchema.plugin(paginatePlugin);
departmentSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.departmentCode = await getAndSetAutoIncrementNo(SCHEMA_CONST.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

const Department = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, departmentSchema);

module.exports = Department;

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
