const mongoose = require("mongoose");
const {findAppParameterValue} = require("../../controllers/v1/settings/appParameter/appParameter");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {QUOTATION_DSKU: SCHEMA_CONST, QUOTATION_SKU} = require("../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const quotationDSKUSchema = new mongoose.Schema(
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
        quotationNo: {
            type: String,
            required: false
        },
        revNo: {
            type: Number,
            required: false
        },
        quotationDate: {
            type: Date,
            required: false
        },
        customerCategory: {
            type: String,
            required: false
        },
        exchangeRate: {
            type: Number,
            required: false,
            default: 0
        },
        reference: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            refPath: "referenceModel"
        },
        referenceModel: {
            type: String,
            enum: ["Customer", "Prospect"],
            required: false
        },
        customerName: {
            type: String,
            required: false
        },
        currency: {
            type: String,
            required: false
        },
        quotationDetails: [
            {
                srNo: {
                    type: Number,
                    required: false
                },
                DSKU: {
                    type: String,
                    ref: "NPDMaster",
                    required: false
                },
                DSKUNo: {
                    type: String,
                    required: false
                },
                DSKUName: {
                    type: String,
                    required: false
                },
                DSKUDescription: {
                    type: String,
                    required: false
                },
                drawingRef: {
                    type: String,
                    required: false
                },
                partNo: {
                    type: String,
                    required: false
                },
                UOM: {
                    type: String,
                    required: false
                },
                MOQ: {
                    type: Number,
                    required: false
                },
                QPrice: {
                    type: Number,
                    required: false
                },
                developmentCost: {
                    type: Number,
                    required: false
                }
            }
        ],
        status: {
            type: String,
            required: false
        },
        RFQReference: {
            type: String,
            required: false
        },
        revHistory: []
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

quotationDSKUSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        const modulePrefix = await findAppParameterValue("QUOTATION_DSKU_MODULE_PREFIX", this.company);
        const SKUModulePrefix = QUOTATION_SKU.MODULE_PREFIX;
        this.quotationNo = await getAndSetAutoIncrementNo(
            {...SCHEMA_CONST.AUTO_INCREMENT_DATA(), modulePrefix},
            this.company,
            true
        );
        this.quotationNo = this.quotationNo.replace(SKUModulePrefix, modulePrefix);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
quotationDSKUSchema.index({status: -1});
quotationDSKUSchema.index({quotationDate: -1});
quotationDSKUSchema.plugin(paginatePlugin);
const QuotationDSKU = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, quotationDSKUSchema);

module.exports = QuotationDSKU;
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
