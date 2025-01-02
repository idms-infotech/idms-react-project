const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {OPTIONS} = require("../../helpers/global.options");
const {setAssetsClassNextAutoIncrementNo} = require("../../controllers/v1/settings/assetClass/assetClass");
const {ASSET: SCHEMA_CONST} = require("../../mocks/schemasConstant/financeConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const assetSchema = new mongoose.Schema(
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
        assetType: {
            type: String,
            required: false
        },
        assetClassId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "AssetClass"
        },
        assetCode: {
            type: String,
            required: false
        },
        assetName: {
            type: String,
            required: false
        },
        assetDescription: {
            type: String,
            required: false
        },
        assetUniqueID: {
            type: String,
            required: false
        },
        assetOrigin: {
            type: String,
            required: false
        },
        // assetSerialNumber: {
        //     type: String,
        //     required: false
        // },
        // countryOfOrigin: {
        //     type: String,
        //     required: false
        // },
        // manufacturer: {
        //     type: String,
        //     required: false
        // },
        // supplier: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     required: false,
        //     ref: "Supplier"
        // },
        assetPurchaseDate: {
            type: Date,
            required: false
        },
        // installationDate: {
        //     type: Date,
        //     required: false
        // },
        // warrantyExpiryDate: {
        //     type: Date,
        //     required: false
        // },
        location: {
            type: String,
            required: false
        },
        depreciationStartDate: {
            type: Date,
            required: false
        },
        costingInput: {
            // actualMachineCost: {
            //     type: Number,
            //     required: false
            // },
            assetPurchaseCost: {
                type: Number,
                required: false
            },
            financeCost: {
                type: Number,
                required: false
            },
            totalAssetClass: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            // estimatedResidual: {
            //     type: Number,
            //     set: value => {
            //         if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
            //             return parseFloat(value).toFixed(2);
            //         }
            //     },
            //     required: false
            // },
            estimatedUsefulLifeInYear: {
                type: Number,
                required: false
            },
            depreciatedAssetCostPerYear: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            // depreciationStartDate: {
            //     type: Date,
            //     required: false
            // },
            // usedLifeTillDateInYear: {
            //     type: Number,
            //     required: false
            // },
            // estimatedBalanceLifeInYear: {
            //     type: Number,
            //     set: value => {
            //         if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
            //             return parseFloat(value).toFixed(2);
            //         }
            //     },
            //     required: false
            // },
            noOfOperationalDaysPerYear: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            // noOfOperationalDaysPerMonth: {
            //     type: Number,
            //     set: value => {
            //         if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
            //             return parseFloat(value).toFixed(2);
            //         }
            //     },
            //     required: false
            // },
            noOfShiftsRunPerDays: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            machineEfficiencyPercentage: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            }
            // assetCostDepreciationPerHr: {
            //     type: Number,
            //     set: value => {
            //         if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
            //             return parseFloat(value).toFixed(2);
            //         }
            //     },
            //     required: false
            // },
            // ratedPowerOfMachine: {
            //     type: Number,
            //     set: value => {
            //         if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
            //             return parseFloat(value).toFixed(2);
            //         }
            //     },
            //     required: false
            // },
            // energyConsumptionPerHr: {
            //     type: Number,
            //     set: value => {
            //         if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
            //             return parseFloat(value).toFixed(2);
            //         }
            //     },
            //     required: false
            // },
            // unitRate: {
            //     type: Number,
            //     required: false
            // },
            // energyCostPerHour: {
            //     type: Number,
            //     required: false
            // }
        },
        totalAssetCostPerHr: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        totalAssetCostPerShift: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        assetPurchaseCost: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        // depreciationMethod: {
        //     type: String,
        //     required: false,
        //     default: "Straight Line"
        // },

        // depreciationRate: {
        //     type: Number,
        //     set: value => {
        //         if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
        //             return parseFloat(value).toFixed(2);
        //         }
        //     },
        //     required: false
        // },
        // energySpec: {
        //     powerConsumption: {
        //         type: Number,
        //         required: false
        //     },
        //     usageHrsPerShift: {
        //         type: Number,
        //         required: false
        //     },
        //     energyConsumedPerShift: {
        //         type: Number,
        //         required: false
        //     },
        //     unitRate: {
        //         type: Number,
        //         required: false
        //     },
        //     powerCostPerShift: {
        //         type: Number,
        //         required: false
        //     },
        //     powerCostPerHour: {
        //         type: Number,
        //         required: false
        //     }
        // },
        status: {
            type: String,
            required: true,
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

assetSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        await setAssetsClassNextAutoIncrementNo(this.assetClassId);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
assetSchema.index({status: -1});
assetSchema.plugin(paginatePlugin);

const Asset = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, assetSchema);

module.exports = Asset;
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
