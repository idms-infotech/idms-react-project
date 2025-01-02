const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {OPTIONS} = require("../../helpers/global.options");
const {RM_SPECIFICATION: SCHEMA_CONST} = require("../../mocks/schemasConstant/qualityConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin, reportPaginatePlugin} = require("../plugins/paginatePlugin");
const rmSpecificationSchema = new mongoose.Schema(
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
        rmSpecificationCode: {
            type: String,
            required: false
        },
        itemCategory: {
            type: String,
            required: false
        },
        item: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Items"
        },
        specificationInfo: [
            {
                seq: {
                    type: Number,
                    required: false
                },
                specificationCode: {
                    type: String,
                    required: false
                },
                characteristic: {
                    type: String,
                    required: false
                },
                UOM: {
                    type: String,
                    required: false
                },
                testStandard: {
                    type: String,
                    required: false
                },
                measuringInstrument: {
                    type: String,
                    required: false
                },
                specValue: {
                    type: String,
                    required: false
                },
                tolerance: {
                    type: Number,
                    required: false
                },
                LTL: {
                    type: Number,
                    required: false
                },
                UTL: {
                    type: Number,
                    required: false
                }
            }
        ],
        status: {
            type: String,
            required: false,
            enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
            default: OPTIONS.defaultStatus.ACTIVE
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
rmSpecificationSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.rmSpecificationCode = await getAndSetAutoIncrementNo(
            SCHEMA_CONST.AUTO_INCREMENT_DATA(),
            this.company,
            true
        );
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

rmSpecificationSchema.index({status: -1});
rmSpecificationSchema.plugin(paginatePlugin);
rmSpecificationSchema.plugin(reportPaginatePlugin);

const RMSpecification = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, rmSpecificationSchema);

module.exports = RMSpecification;
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
