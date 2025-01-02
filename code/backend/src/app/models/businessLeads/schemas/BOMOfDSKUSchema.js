const {default: mongoose} = require("mongoose");
const {OPTIONS} = require("../../../helpers/global.options");

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
    BOMNo: {
        type: String,
        required: false
    },
    SKU: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "NPDMaster"
    },
    documentDetails: [
        {
            documentNo: {
                type: String,
                required: false
            },
            documentDate: {
                type: Date,
                required: false,
                default: new Date()
            },
            revisionNo: {
                type: String,
                required: false
            },
            revisionDate: {
                type: Date,
                required: false,
                default: new Date()
            },
            docCreatedBy: {
                type: String,
                required: false
            },
            docApprovedBy: {
                type: String,
                required: false
            },
            QMSDocumentNo: {
                type: String,
                required: false
            }
        }
    ],
    SKUCode: {
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
    partCount: {
        type: Number,
        required: false
    },
    BOMOfSKUDetails: [
        {
            reference: {
                type: mongoose.Schema.Types.ObjectId,
                refPath: "referenceModel"
            },
            referenceModel: {
                type: String,
                enum: ["ProductionItem", "Items", "InkMaster"]
            },
            itemCode: {
                type: String,
                required: false
            },
            itemName: {
                type: String,
                required: false
            },
            itemDescription: {
                type: String,
                required: false
            },
            supplierCode: {
                type: String,
                required: false
            },
            UOM: {
                type: String,
                required: false
            },
            qtyPerSKUUnit: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                        return parseFloat(value).toFixed(5);
                    }
                },
                required: false
            },
            wastePercentage: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            partCount: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(5);
                    }
                },
                required: false
            },
            unitCost: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            itemCost: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(5);
                    }
                },
                required: false
            },
            BOM: {
                type: String,
                required: false
            }
        }
    ],
    totalMaterialCost: {
        type: Number,
        set: value => {
            if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                return parseFloat(value).toFixed(2);
            }
        },
        required: false
    },
    isColorInfo: {
        type: Boolean,
        required: false,
        default: false
    },
    isConvertedToBOMOfSKU: {
        type: Boolean,
        required: false,
        default: false
    },
    status: {
        type: String,
        required: false,
        default: OPTIONS.defaultStatus.ACTIVE
    }
};
