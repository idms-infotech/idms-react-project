const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {PROSPECT_MASTER: SCHEMA_CONST} = require("../../mocks/schemasConstant/businessLeadsConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const prospectSchema = new mongoose.Schema(
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
        prospectRegistrationCode: {
            type: String,
            required: false
        },
        prospectRegistrationDate: {
            type: Date,
            required: false
        },
        prospectName: {
            type: String,
            required: false
        },
        customerCategory: {
            type: String,
            required: false
        },
        currency: {
            type: String,
            required: false
        },
        correspondenceAddress: {
            line1: {
                type: String,
                required: false,
                trim: true
            },
            line2: {
                type: String,
                required: false,
                trim: true
            },
            line3: {
                type: String,
                required: false,
                trim: true
            },
            line4: {
                type: String,
                required: false,
                trim: true
            },
            state: {
                type: String,
                required: false,
                trim: true
            },
            city: {
                type: String,
                required: false,
                trim: true
            },
            pinCode: {
                type: String,
                required: false,
                trim: true
            },
            country: {
                type: String,
                required: false,
                trim: true
            }
        },
        contactDetails: [
            {
                contactPersonName: {
                    type: String,
                    required: false
                },
                contactPersonDepartment: {
                    type: String,
                    required: false,
                    default: "Others"
                },
                contactPersonDesignation: {
                    type: String,
                    required: false
                },
                contactPersonNumber: {
                    type: String,
                    required: false
                },
                contactPersonEmail: {
                    type: String,
                    required: false
                }
            }
        ],
        status: {
            type: String,
            required: false,
            //  enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
            default: OPTIONS.defaultStatus.ACTIVE
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

prospectSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.prospectRegistrationCode = await getAndSetAutoIncrementNo(
            {...SCHEMA_CONST.AUTO_INCREMENT_DATA()},
            this.company,
            true
        );
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
prospectSchema.index({status: -1});
prospectSchema.index({prospectRegistrationDate: -1});
prospectSchema.plugin(paginatePlugin);
const Prospect = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, prospectSchema);

module.exports = Prospect;
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
