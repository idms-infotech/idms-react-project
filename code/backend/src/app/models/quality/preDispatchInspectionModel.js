const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {PRE_DISPATCH_INSPECTION: SCHEMA_CONST} = require("../../mocks/schemasConstant/qualityConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const preDispatchInspectionSchema = new mongoose.Schema(
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
        preDispatchCode: {
            type: String,
            required: false
        },
        preDispatchDate: {
            type: Date,
            required: false,
            default: new Date()
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
        salesInvoice: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "SalesInvoice"
        },
        salesInvoiceNumber: {
            type: String,
            required: false
        },
        salesInvoiceDate: {
            type: Date,
            required: false
        },
        isGenerated: {
            type: Boolean,
            required: false,
            default: false
        },
        preDispatchDetails: [
            {
                // sn: {
                //     type: Number,
                //     required: false,
                // },
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
                partNumber: {
                    type: String,
                    required: false
                },
                UOM: {
                    type: String,
                    required: false
                },
                batchDate: {
                    type: String,
                    required: false
                },
                dispatchQty: {
                    type: Number,
                    required: false
                },
                PDIEntryDetails: [
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
                        LTL: {
                            type: String,
                            required: false
                        },
                        UTL: {
                            type: String,
                            required: false
                        },
                        observation: {
                            type: String,
                            required: false
                        }
                    }
                ],
                status: {
                    type: String,
                    required: false
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
preDispatchInspectionSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

preDispatchInspectionSchema.index({isGenerated: -1});
preDispatchInspectionSchema.index({preDispatchDate: -1});
preDispatchInspectionSchema.plugin(paginatePlugin);

const PreDispatchInspection = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, preDispatchInspectionSchema);

module.exports = PreDispatchInspection;
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
