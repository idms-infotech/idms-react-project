const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {OPTIONS} = require("../../helpers/global.options");
const {CREDIT_NOTE: SCHEMA_CONST} = require("../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin, reportPaginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const creditNoteSchema = new mongoose.Schema(
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
        CNNumber: {
            type: String,
            required: false
        },
        CNDate: {
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
        creditFor: {
            type: String,
            required: false
        },
        reasonCategory: {
            type: String,
            required: false
        },
        reasonForCNId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "ReasonForCN"
        },
        currency: {
            type: String,
            required: false
        },
        CNDetails: [
            {
                CNLineNumber: {
                    type: Number,
                    set: value => setTwoDecimal(value),
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
                CPartNo: {
                    type: String,
                    required: false
                },
                UOM: {
                    type: String,
                    required: false
                },
                hsn: {
                    type: String,
                    required: false
                },
                gst: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                igst: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                cgst: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                sgst: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                returnQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                purchaseRate: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                lineValue: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                }
            }
        ],
        netCNValue: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        CNServiceDetails: [
            {
                serviceMaster: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "SalesServiceMaster"
                },
                descOfService: {
                    type: String,
                    required: false
                },
                SACCode: {
                    type: String,
                    required: false
                },
                creditValue: {
                    type: Number,
                    required: false
                }
            }
        ],
        oldInvNo: {
            type: String,
            required: false
        },
        oldInvDate: {
            type: Date,
            required: false
        },
        CNStatus: {
            type: String,
            required: false,
            enum: OPTIONS.defaultStatus.getAllCNStatusAsArray(),
            default: OPTIONS.defaultStatus.AWAITING_APPROVAL
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

creditNoteSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.CNNumber = await getAndSetAutoIncrementNo({...SCHEMA_CONST.AUTO_INCREMENT_DATA()}, this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
creditNoteSchema.index({CNStatus: -1});
creditNoteSchema.index({CNDate: -1});
creditNoteSchema.plugin(paginatePlugin);
creditNoteSchema.plugin(reportPaginatePlugin);
const CreditNote = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, creditNoteSchema);

module.exports = CreditNote;
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
