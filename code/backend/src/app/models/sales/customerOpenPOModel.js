const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {CUSTOMER_OPEN_PO: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const customerOpenPOSchema = new mongoose.Schema(
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
        custOpenPOCode: {
            type: String,
            required: false
        },
        customerCategory: {
            type: String,
            required: false
        },
        categoryType: {
            type: String,
            required: false
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
        customerPONo: {
            type: String,
            required: false
        },
        customerPODate: {
            type: Date,
            required: false
        },
        customerPORevNo: {
            type: String,
            required: false
        },
        customerPORevDate: {
            type: Date,
            required: false
        },
        POValidTillDate: {
            type: Date,
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
            default: OPTIONS.defaultStatus.ACTIVE
        },
        SKUDetails: [
            {
                isSelect: {
                    type: Boolean,
                    required: false,
                    default: true
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
                customerPartNo: {
                    type: String,
                    required: false
                },
                lineItemNo: {
                    type: String,
                    required: false
                },
                itemRevisionNo: {
                    type: String,
                    required: false
                }
            }
        ]
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

customerOpenPOSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.custOpenPOCode = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
customerOpenPOSchema.plugin(paginatePlugin);
const CustomerOpenPO = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, customerOpenPOSchema);

module.exports = CustomerOpenPO;
const auditTrail = async (master, modifiedPaths, isNew, isModified) => {
    const {createdBy, updatedBy, company} = master;
    const auditTrail = {
        company: company,
        oldData: JSON.stringify(await master.constructor.findById(master._id)),
        data: JSON.stringify(master),
        user: isNew ? createdBy : updatedBy, // Replace with the actual current user's name
        action: isNew ? SCHEMA_CONSTANT.ADDED_ACTION : SCHEMA_CONSTANT.UPDATED_ACTION,
        fieldsModified: modifiedPaths.toString()
    };
    await Audit.auditModule(auditTrail);
};
