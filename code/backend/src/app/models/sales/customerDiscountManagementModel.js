const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {CUSTOMER_DISCOUNT_MANAGEMENT: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const customerDiscountManagementSchema = new mongoose.Schema(
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
        discountNo: {
            type: String,
            required: false
        },
        discountDescription: {
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
            required: true,
            ref: "Customer"
        },
        customerName: {
            type: String,
            required: false
        },
        globalDiscount: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        customerDiscountInfo: [
            {
                SKU: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "SKUMaster"
                },
                SKUCategory: {
                    type: String,
                    required: false
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
                unitPrice: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                discountInfo: {
                    discountType: {
                        type: String,
                        required: false
                    },
                    discountValue: {
                        type: Number,
                        required: false
                    },
                    discountDescription: {
                        type: String,
                        required: false
                    },
                    usageLimit: {
                        type: Number,
                        required: false
                    },
                    discountStartDate: {
                        type: Date,
                        required: false
                    },
                    discountEndDate: {
                        type: Date,
                        required: false
                    },
                    minPurchaseQty: {
                        type: Number,
                        required: false
                    },
                    minPurchaseAmt: {
                        type: Number,
                        required: false
                    }
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

customerDiscountManagementSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.discountNo = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
customerDiscountManagementSchema.plugin(paginatePlugin);
const customerDiscountManagement = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, customerDiscountManagementSchema);

module.exports = customerDiscountManagement;
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
