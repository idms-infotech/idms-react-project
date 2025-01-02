const mongoose = require("mongoose");
const Audit = require("../../../controllers/v1/settings/audit/audit");
const {OPTIONS} = require("../../../helpers/global.options");
const {BOM_OF_PRODUCT: SCHEMA_CONST} = require("../../../mocks/schemasConstant/planningConstant");
const {getAndSetAutoIncrementNo} = require("../../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../../plugins/paginatePlugin");
const BoMOfProductSchema = new mongoose.Schema(
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
        BOMNo: {
            type: String,
            required: false
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "ProductMaster"
        },
        productNo: {
            type: String,
            required: false
        },
        productCategory: {
            type: String,
            required: false
        },
        productName: {
            type: String,
            required: false
        },
        productDescription: {
            type: String,
            required: false
        },
        UOM: {
            type: String,
            required: false
        },
        partCount: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
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
        BoMOfProductDetails: [
            {
                reference: {
                    type: mongoose.Schema.Types.ObjectId,
                    refPath: "referenceModel"
                },
                referenceModel: {
                    enum: ["ProductionItem", "Items", "InkMaster", "ChildItem"],
                    type: String
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

BoMOfProductSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.BOMNo = await getAndSetAutoIncrementNo({...SCHEMA_CONST.AUTO_INCREMENT_DATA()}, this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

BoMOfProductSchema.plugin(paginatePlugin);

const BoMOfProduct = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, BoMOfProductSchema);

module.exports = BoMOfProduct;
const auditTrail = async (master, modifiedPaths, isNew, isModified) => {
    const {createdBy, updatedBy, company} = master;
    const auditTrail = {
        company: company,
        oldData: JSON.stringify(await master.constructor.findById(master._id)),
        data: JSON.stringify(master),
        user: isNew ? createdBy : updatedBy,
        action: isNew ? SCHEMA_CONST.ADDED_ACTION : SCHEMA_CONST.UPDATED_ACTION,
        fieldsModified: modifiedPaths.toString()
    };
    await Audit.auditModule(auditTrail);
};
