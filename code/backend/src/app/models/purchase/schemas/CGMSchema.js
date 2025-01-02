const {default: mongoose} = require("mongoose");
const {PURCHASE_HSN, SUPPLIER} = require("../../../mocks/schemasConstant/purchaseConstant");
exports.SCHEMA = {
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
    capitalGoodsNo: {
        type: String,
        required: true
    },
    capitalGoodsName: {
        type: String,
        required: true
    },
    capitalGoodsDescription: {
        type: String,
        required: true
    },
    capitalGoodsSpecification: {
        type: String,
        required: false
    },
    hsnCode: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: PURCHASE_HSN.COLLECTION_NAME
    },
    UOM: {
        type: String,
        required: true
    },
    technicalSheetFile: {
        type: String,
        required: false
    },
    supplierInfo: {
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: SUPPLIER.COLLECTION_NAME
        },
        supplierPartNo: {
            type: String,
            required: false
        },
        currency: {
            type: String,
            required: false
        },
        purchaseCost: {
            type: Number,
            required: true
        }
    },
    isActive: {
        type: Boolean,
        required: false,
        default: true
    }
};
