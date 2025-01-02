const {default: mongoose} = require("mongoose");

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
    NPDMasterCode: {
        type: String,
        required: false
    },
    SKUStage: {
        type: String,
        required: false
    },
    dSKUNo: {
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
    productCategory: {
        type: String,
        required: false
    },
    NPDReview: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "NPDReview"
    },
    hsn: {
        type: String,
        required: false
    },
    isConvertedToSKU: {
        type: Boolean,
        required: false,
        default: false
    },
    HSN: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "HSN"
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
    primaryUnit: {
        type: String,
        required: false
    },
    secondaryUnit: {
        type: String,
        required: false
    },
    conversionFactor: {
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
    conversionOfUnits: {
        type: String,
        required: false
    },
    unitConversionFlag: {
        type: Number,
        required: false
    },
    isActive: {
        type: String,
        required: false
    },
    customerInfo: [
        {
            reference: {
                type: mongoose.Schema.Types.ObjectId,
                refPath: "referenceModel"
            },
            referenceModel: {
                type: String,
                enum: ["Customer", "Prospect"]
            },
            customerName: {
                type: String,
                required: false
            },
            customerPartNo: {
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
                type: Number,
                required: false
            },
            PONo: {
                type: String,
                required: false
            },
            PODate: {
                type: Date,
                required: false
            },
            POValidDate: {
                type: Date,
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
    inkDetails: [
        {
            inkId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: "InkMaster"
            },
            colSeq: {
                type: Number,
                set: value => {
                    if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
                        return parseFloat(value).toFixed(2);
                    }
                },
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
                        return parseFloat(value).toFixed(2);
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
    materialInfo: [
        {
            item: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                refPath: "referenceModel"
            },
            referenceModel: {
                enum: ["ProductionItem", "Items", "ChildItem"],
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
            }
        }
    ],
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
    drawingArtWorkFile: {
        type: String,
        required: false
    },
    productionLayoutFile: {
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
    generalSpecifications: {
        type: String,
        required: false
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
        // }
    }
};
