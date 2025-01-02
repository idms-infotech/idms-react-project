const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {OPTIONS} = require("../../helpers/global.options");
const {INK_MASTER: SCHEMA_CONST} = require("../../mocks/schemasConstant/productionConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const inkMasterSchema = new mongoose.Schema(
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
        // HSN: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     required: true,
        //     ref: "HSN"
        // },
        // HSNCode: {
        //     type: String,
        //     required: false
        // },
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
        UoM: {
            type: String,
            required: false
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
        primaryConversion: {
            type: Number,
            required: false
        },
        secondaryConversion: {
            type: Number,
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
        labValues: {
            L: {
                type: Number,
                required: false
            },
            a: {
                type: Number,
                required: false
            },
            b: {
                type: Number,
                required: false
            }
        },
        inkMasterDetails: [
            {
                item: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    refPath: "referenceModel"
                },
                referenceModel: {
                    type: String,
                    enum: ["Items", "InkMaster"]
                },
                seq: {
                    type: Number,
                    required: false
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
                qtyPerKgInitial: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                percentageLoading: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                UoM: {
                    type: String,
                    required: false
                },
                qtyPerKgFinal: {
                    type: Number,
                    set: value => setTwoDecimal(value, 4),
                    required: false
                },
                ratePerUnit: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: true
                },
                itemCost: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: true
                }
            }
        ],

        inkCostPerKg: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        totalCost: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        totalQty: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                    return parseFloat(value).toFixed(4);
                }
            },
            required: false
        },
        inkCostPerGm: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                    return parseFloat(value).toFixed(3);
                }
            },
            required: false
        },
        totalCostPerGm: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        totalQtyPerGm: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                    return parseFloat(value).toFixed(4);
                }
            },
            required: false
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

inkMasterSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.itemCode = await getAndSetAutoIncrementNo({...SCHEMA_CONST.AUTO_INCREMENT_DATA()}, this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
inkMasterSchema.index({status: -1});
inkMasterSchema.plugin(paginatePlugin);
const InkMaster = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, inkMasterSchema);
module.exports = InkMaster;
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
