const mongoose = require("mongoose");
const {getAutoIncrementNumber, setTwoDecimal} = require("../../helpers/utility");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {
    getAllSKUCategory,
    setSKUMasterAutoIncrementNo
} = require("../../controllers/v1/settings/SKUCategoryMaster/SKUCategoryMaster");
const {SKU_MASTER: SCHEMA_CONST} = require("../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin, reportPaginatePlugin} = require("../plugins/paginatePlugin");
const {CONSTANTS} = require("../../../config/config");
const SKUMasterSchema = new mongoose.Schema(
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
        SKUNo: {
            type: String,
            required: false
        },
        productCategory: {
            type: String,
            required: false
        },
        productCode: {
            type: String,
            required: false
        },
        SKUStage: {
            type: String,
            required: true
        },
        SKUName: {
            type: String,
            required: true
        },
        SKUDescription: {
            type: String,
            required: true
        },
        hsn: {
            type: String,
            required: true
        },
        internalPartNo: {
            type: String,
            required: false
        },
        artWorkNo: {
            type: String,
            required: false
        },
        artWorkHyperLink: {
            type: String,
            required: false
        },
        additionalHyperLink: {
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
            type: Number,
            required: false
        },
        secondaryToPrimaryConversion: {
            type: Number,
            required: false
        },
        customerInfo: [
            {
                customer: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "Customer"
                },
                customerName: {
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
                customerPartNo: {
                    type: String,
                    required: false
                },
                customerPartDescription: {
                    type: String,
                    required: false
                },
                PONo: {
                    type: String,
                    required: false
                },
                PODate: {
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
                customerCurrency: {
                    type: String,
                    required: false
                },
                standardSellingRate: {
                    type: Number,
                    required: false
                },
                monthlyOffTake: {
                    type: String,
                    required: false
                },
                POValidDate: {
                    type: Date,
                    required: false
                },
                rateType: {
                    type: String,
                    required: false
                },
                sellingRateCommon: [
                    {
                        currency: {
                            type: String,
                            required: false
                        },
                        unit1: {
                            type: String,
                            required: false
                        },
                        MOQ1: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        rate1: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        unit2: {
                            type: String,
                            required: false
                        },
                        MOQ2: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        rate2: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        }
                    }
                ]
            }
        ],
        location: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Location"
        },
        locationName: {
            type: String,
            required: false
        },
        // perishableGoods: {
        //     type: String,
        //     required: false,
        // },
        shelfLife: {
            type: Number,
            set: value => {
                value = +value;
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
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
        generalSpecifications: {
            type: String,
            required: false
        },
        // productionLayoutFile: {
        //     type: String,
        //     required: false
        // },
        // drawingArtWorkFile: {
        //     type: String,
        //     required: false
        // },
        // photoCreate: {
        //     type: String,
        //     required: false,
        // },
        // photoFile: {
        //     type: String,
        //     required: false,
        // },
        inkDetails: [
            {
                inkId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "ProductionItem"
                },
                colSeq: {
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
                UoM: {
                    type: String,
                    required: false
                },
                mesh: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                GSM: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                areaSqm: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                            return parseFloat(value).toFixed(4);
                        }
                    },
                    required: false
                },
                inkArea: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                            return parseFloat(value).toFixed(4);
                        }
                    },
                    required: false
                },
                inkAreaSqm: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                            return parseFloat(value).toFixed(4);
                        }
                    },
                    required: false
                },
                ink: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                            return parseFloat(value).toFixed(4);
                        }
                    },
                    required: false
                },
                inkCostPerKg: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                inkCostPerGm: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                }
            }
        ],
        totalNoOfColors: {
            type: Number,
            set: value => {
                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                    return parseFloat(value).toFixed(2);
                }
            },
            required: false
        },
        materialInfo: [
            {
                item: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    refPath: "referenceModel"
                },
                referenceModel: {
                    enum: ["SKUMaster", "Items", "ProductionItem"],
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
                UoM: {
                    type: String,
                    required: false
                },
                qtyPerSKUUnit: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                            return parseFloat(value).toFixed(4);
                        }
                    },
                    required: false
                },
                isSelect: {
                    type: Boolean,
                    required: false,
                    default: false
                },
                unitCost: {
                    type: Number,
                    required: false
                },
                ups: {
                    type: Number,
                    set: value => setTwoDecimal(value),
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
                conversionOfUnits: {
                    type: String,
                    required: false
                },
                width: {
                    type: Number,
                    set: value => setTwoDecimal(value, 4),
                    required: false
                },
                length: {
                    type: Number,
                    set: value => setTwoDecimal(value, 4),
                    required: false
                },
                widthUnit: {
                    type: String,
                    required: false
                },
                lengthUnit: {
                    type: String,
                    required: false
                },
                primaryToSecondaryConversion: {
                    type: Number,
                    set: value => setTwoDecimal(value, 3),
                    required: false
                },
                secondaryToPrimaryConversion: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                childItemDescription: {
                    type: String,
                    required: false
                },
                layoutDimArea: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                }
            }
        ],
        dimensionsDetails: {
            actualDimensions: {
                unit: {
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
                ups: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                area: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                            return parseFloat(value).toFixed(4);
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
            layoutDimensions: {
                unit: {
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
                ups: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                area: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                            return parseFloat(value).toFixed(4);
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
                },
                wastePercentage: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                            return parseFloat(value).toFixed(4);
                        }
                    },
                    required: false
                }
            }
        },
        otherInfo: {
            machinePreference: {
                type: String,
                required: false
            },
            positiveRemarks: {
                type: String,
                required: false
            },
            toolIdentification: {
                type: String,
                required: false
            },
            artworkPath: {
                type: String,
                required: false
            },
            productionRemarks: {
                type: String,
                required: false
            }
        },
        specificationInfo: [
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
                tolerance: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                }
            }
        ],
        costSheetInfo: [
            {
                order: {
                    type: Number,
                    required: false
                },
                componentType: {
                    type: String,
                    required: false
                },
                costElement: {
                    type: String,
                    required: false
                },
                SKUUnit: {
                    type: String,
                    required: false
                },
                isTotal: {
                    type: Boolean,
                    required: false,
                    default: false
                },
                costPerSKUUnit: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                },
                percentage: {
                    type: Number,
                    set: value => {
                        if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                            return parseFloat(value).toFixed(2);
                        }
                    },
                    required: false
                }
            }
        ],
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
        offTakeInfo: {
            annualOffTake: {
                type: Number,
                required: false
            },
            offTakeFrequency: {
                type: Number,
                required: false
            },
            avgMonthlyOffTake: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
                required: false,
                required: false
            },
            proposedBatchQty: {
                type: Number,
                required: false
            },
            processCAQty: {
                type: Number,
                required: false
            },
            toolingCAQty: {
                type: Number,
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
        isActive: {
            type: String,
            required: false,
            default: "A"
        },
        remarks: {
            type: String,
            required: false
        },
        toolInfo: {
            tool1Id: {
                type: String,
                required: false
            },
            tool2Id: {
                type: String,
                required: false
            },
            tool3Id: {
                type: String,
                required: false
            }
        },
        specsAttribute: {
            diameter: {
                type: Number,
                required: false
            },
            height: {
                type: Number,
                required: false
            },
            finish: {
                type: String,
                required: false
            },
            shoulderType: {
                type: String,
                required: false
            },
            threadType: {
                type: String,
                required: false
            },
            orifice: {
                type: String,
                required: false
            },
            weight: {
                type: Number,
                required: false
            },
            placeHolder: {
                type: String,
                required: false
            }
        },
        mouldsIDAttribute: [
            {
                mouldNo: {
                    type: String,
                    required: false
                }
                // mouldType: {
                //     type: String,
                //     required: false
                // }
            }
        ],
        packingStdAttribute: {
            primaryPacking: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            secondaryPacking: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            }
        },
        SKUDimStatus: {
            type: String,
            required: false
        },
        SKUMaterialStatus: {
            type: String,
            required: false
        },
        SKUInkStatus: {
            type: String,
            required: false
        },
        SKUInfo: [
            {
                dynamicForm: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "DynamicForms"
                },
                inputValue: {
                    type: String,
                    required: false
                }
            }
        ],
        SKUStockLevels: {
            // minLevel: {
            //     type: Number,
            //     set: value => setTwoDecimal(value),
            //     required: false
            // },
            // maxLevel: {
            //     type: Number,
            //     set: value => setTwoDecimal(value),
            //     required: false
            // },
            // restoreAlert: {
            //     type: Number,
            //     set: value => setTwoDecimal(value),
            //     required: false
            // }
            avgMonthlyConsumption: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            operationDaysInMonth: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            leadTime: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            // invProcurementCycle: {
            //     type: Number,
            //     set: value => setTwoDecimal(value),
            //     required: false
            // },
            // deliveryProcurementCycle: {
            //     type: Number,
            //     set: value => setTwoDecimal(value),
            //     required: false
            // },
            safetyStockPeriod: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            avgDailyConsumption: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            manufacturingBatchSize: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            // reorderQty: {
            //     type: Number,
            //     set: value => setTwoDecimal(value),
            //     required: false
            // },
            safetyStock: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            reorderLevel: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            minLevel: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            maxLevel: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            }
        },
        SKUImage: {
            type: String,
            required: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

SKUMasterSchema.set("toJSON", {virtuals: true});

// SKUMasterSchema.virtual("drawingArtWorkFileUrl").get(function () {
//     if (this.drawingArtWorkFile && this.drawingArtWorkFile != "undefined") {
//         return CONSTANTS.domainUrl + "Sku/" + this.drawingArtWorkFile;
//     }
// });
// SKUMasterSchema.virtual("productionLayoutFileUrl").get(function () {
//     if (this.productionLayoutFile && this.productionLayoutFile != "undefined") {
//         return CONSTANTS.domainUrl + "Sku/" + this.productionLayoutFile;
//     }
// });

SKUMasterSchema.virtual("SKUImageUrl").get(function () {
    if (this.SKUImage && this.SKUImage != "undefined") {
        return CONSTANTS.domainUrl + "Sku/" + this.SKUImage;
    }
});

SKUMasterSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        const SKUCategoryList = await getAllSKUCategory(this.company, this.productCategory);
        if (!!SKUCategoryList && SKUCategoryList.length > 0) {
            this.SKUNo = getAutoIncrementNumber(
                SKUCategoryList[0].SKUCategoryPrefix,
                "",
                SKUCategoryList[0].SKUCategoryAutoIncrement,
                SKUCategoryList[0].digit
            );
            await setSKUMasterAutoIncrementNo(this.productCategory);
        } else {
            this.SKUNo = await getAndSetAutoIncrementNo({...SCHEMA_CONST.AUTO_INCREMENT_DATA()}, this.company, true);
        }
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
SKUMasterSchema.index({isActive: -1});
SKUMasterSchema.plugin(paginatePlugin);
SKUMasterSchema.plugin(reportPaginatePlugin);
const SKUMaster = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, SKUMasterSchema);

module.exports = SKUMaster;

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
