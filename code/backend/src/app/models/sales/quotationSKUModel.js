const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {QUOTATION_SKU: SCHEMA_CONST} = require("../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const quotationSKUSchema = new mongoose.Schema(
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
        categoryType: {
            type: String,
            required: false
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
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Customer"
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
                },
                lineValue: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                serviceChargesInfo: [
                    {
                        description: {
                            type: String,
                            required: false
                        },
                        currency: {
                            type: String,
                            required: false
                        },
                        serviceCharges: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        }
                    }
                ]
            }
        ],
        termsAndCond: [
            {
                parameterName: {
                    type: String,
                    required: true,
                    trim: true
                },
                parameterLabel: {
                    type: String,
                    required: true,
                    trim: true
                },
                order: {
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

quotationSKUSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.quotationNo = await getAndSetAutoIncrementNo({...SCHEMA_CONST.AUTO_INCREMENT_DATA()}, this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
quotationSKUSchema.index({status: -1});
quotationSKUSchema.index({quotationDate: -1});
quotationSKUSchema.plugin(paginatePlugin);
const QuotationSKU = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, quotationSKUSchema);

module.exports = QuotationSKU;
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
