const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {OPTIONS} = require("../../helpers/global.options");
const {PRODUCT_SPECIFICATION: SCHEMA_CONST} = require("../../mocks/schemasConstant/qualityConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const productSpecificationSchema = new mongoose.Schema(
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
        productSpecificationCode: {
            type: String,
            required: false
        },
        productCategory: {
            type: String,
            required: false
        },
        SKU: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "SKUMaster"
        },
        SKUNo: {
            type: String,
            required: false
        },
        SKUName: {
            type: String,
            required: false
        },
        SKUDescription: {
            type: String,
            required: false
        },
        UOM: {
            type: String,
            required: false
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
                    type: String,
                    required: false
                },
                UTL: {
                    type: String,
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
productSpecificationSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.productSpecificationCode = await getAndSetAutoIncrementNo(
            SCHEMA_CONST.AUTO_INCREMENT_DATA(),
            this.company,
            true
        );
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

productSpecificationSchema.index({status: -1});
productSpecificationSchema.index({SKU: -1});
productSpecificationSchema.plugin(paginatePlugin);

const ProductSpecification = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, productSpecificationSchema);

module.exports = ProductSpecification;
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
