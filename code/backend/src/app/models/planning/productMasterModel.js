const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {OPTIONS} = require("../../helpers/global.options");
const {PRODUCT_MASTER: SCHEMA_CONST} = require("../../mocks/schemasConstant/planningConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const productMasterSchema = new mongoose.Schema(
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
            required: true
        },
        productDescription: {
            type: String,
            required: true
        },
        hsn: {
            type: String,
            required: true
        },
        primaryUnit: {
            type: String,
            required: false
        },
        secondaryUnit: {
            type: String,
            required: false
        },
        unitConversionFlag: {
            type: Number,
            required: false
        },
        conversionFactor: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        primaryToSecondaryConversion: {
            type: String,
            required: false
        },
        secondaryToPrimaryConversion: {
            type: String,
            required: false
        },
        unitCost: {
            type: Number,
            required: false
        },
        sourceOfMFG: {
            type: String,
            required: false
        },

        shelfLife: {
            type: Number,
            set: value => {
                value = +value;
                if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        storageTemp: {
            type: String,
            required: false
        },
        storageHumidity: {
            type: String,
            required: false
        },
        specialStorageInstruction: {
            type: String,
            required: false
        },
        productionRemarks: {
            type: String,
            required: false
        },
        BOMDimensionInfo: {
            unit1: {
                type: String,
                required: false
            },
            unit2: {
                type: String,
                required: false
            },
            width: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            length: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false
            },
            mSqArea: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                        return parseFloat(value).toFixed(4);
                    }
                },
                required: false
            }
        },
        // dualUnitsDimensionsDetails: {
        //     type: {
        //         type: String,
        //         required: false
        //     },
        //     width: {
        //         type: Number,
        //         required: false
        //     },
        //     length: {
        //         type: Number,
        //         required: false
        //     },
        //     widthUnit: {
        //         type: String,
        //         required: false
        //     },
        //     lengthUnit: {
        //         type: String,
        //         required: false
        //     },
        //     widthInMM: {
        //         type: Number,
        //         required: false
        //     },
        //     lengthInM: {
        //         type: Number,
        //         required: false
        //     },
        //     sqmPerRoll: {
        //         type: Number,
        //         required: false
        //     }
        // },
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

productMasterSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.productNo = await getAndSetAutoIncrementNo({...SCHEMA_CONST.AUTO_INCREMENT_DATA()}, this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

productMasterSchema.plugin(paginatePlugin);

const ProductMaster = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, productMasterSchema);

module.exports = ProductMaster;

// renameCollection();

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
