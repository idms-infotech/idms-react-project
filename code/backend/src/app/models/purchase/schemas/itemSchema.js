const {default: mongoose} = require("mongoose");
const {setTwoDecimal} = require("../../../helpers/utility");

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
    itemCode: {
        type: String,
        required: false
    },
    // item Category
    itemType: {
        type: String,
        required: true
    },
    itemSubCategory: {
        type: String,
        required: false,
        default: "General"
    },
    benchmarkPrice: {
        type: Number,
        required: false,
        default: 0
    },
    itemName: {
        type: String,
        required: false
    },
    itemDescription: {
        type: String,
        required: false
    },
    itemPacking: {
        type: String,
        required: false
    },
    isActive: {
        type: String,
        required: false,
        enum: ["A", "I"],
        default: "A"
    },
    hsn: {
        type: Number,
        required: false
    },
    gst: {
        type: Number,
        required: false,
        default: 0
    },
    igst: {
        type: Number,
        required: false,
        default: 0
    },
    cgst: {
        type: Number,
        required: false,
        default: 0
    },
    sgst: {
        type: Number,
        required: false,
        default: 0
    },
    ugst: {
        type: Number,
        required: false,
        default: 0
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
        type: Number,
        required: false
    },
    secondaryToPrimaryConversion: {
        type: Number,
        required: false
    },
    conversionOfUnits: {
        type: String,
        required: false
    },
    orderInfoUOM: {
        type: String,
        required: false
    },
    unitConversionFlag: {
        type: Number,
        required: false
    },
    qtyOnHand: {
        type: Number,
        required: false,
        default: 0
    },
    reorderLevel: {
        type: Number,
        required: false,
        default: 0
    },
    reorderLevelWeeks: {
        type: Number,
        required: false,
        default: 0
    },
    reorderLevelMax: {
        type: Number,
        required: false,
        default: 0
    },
    moq: {
        type: Number,
        required: false,
        default: 0
    },
    eoq: {
        type: Number,
        required: false,
        default: 0
    },
    annualPurchase: {
        type: Number,
        required: false,
        default: 0
    },
    // inventoryClass: {
    //     type: String,
    //     required: false,
    //     enum: ["A", "I"],
    //     default: "A",
    // },

    location: {
        type: String,
        required: false,
        default: "-"
    },
    image: {
        type: String,
        required: false
    },
    rfqCreate: {
        type: String,
        required: false
    },
    assetCreate: {
        type: String,
        required: false
    },
    tdsCreate: {
        type: String,
        required: false
    },
    tdsFile: {
        type: String,
        required: false
    },
    msdsCreate: {
        type: String,
        required: false
    },
    msdsFile: {
        type: String,
        required: false
    },
    drawing: {
        type: String,
        required: false
    },
    rohsCreate: {
        type: String,
        required: false
    },
    rohsFile: {
        type: String,
        required: false
    },
    perishableGoods: {
        type: String,
        required: false
    },
    shelfLife: {
        type: Number,
        required: false
    },
    storageTemp: {
        type: Number,
        required: false
    },
    storageHumidity: {
        type: Number,
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
    QCLevels: {
        type: String,
        required: false
    },
    binNumber: {
        type: String,
        required: false
    },
    casNumber: {
        type: String,
        required: false
    },
    locationId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "Location"
    },
    locationName: {
        type: String,
        required: false
    },
    leadTime: {
        type: Number,
        required: false
    },
    remarks: {
        type: String,
        required: false
    },
    itemAMU: {
        type: Number,
        required: false
    },
    itemROL: {
        type: Number,
        required: false
    },
    itemMiSL: {
        type: Number,
        required: false
    },
    itemMaSL: {
        type: Number,
        required: false
    },
    supplierDetails: [
        {
            supplierId: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: "Supplier"
            },
            supplierName: {
                type: String,
                required: false
            },
            supplierCurrency: {
                type: String,
                required: false
            },
            supplierDescription: {
                type: String,
                required: false
            },
            spin: {
                type: String,
                required: false
            },
            uom1: {
                type: String,
                required: false
            },
            uom2: {
                type: String,
                required: false
            },
            stdCostUom1: {
                type: Number,
                set: value => setTwoDecimal(value, 3),
                required: false,
                default: 0
            },
            stdCostUom2: {
                type: Number,
                set: value => setTwoDecimal(value, 3),
                required: false,
                default: 0
            },
            leadTime: {
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
            supplierPrice: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false,
                default: 0
            },
            supplierBenchmarkPrice: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false,
                default: 0
            },
            primarySupplier: {
                type: String,
                required: false
            },
            uomPurchaseCost: {
                type: String,
                required: false
            }
        }
    ],
    channelDetails: [
        {
            channelId: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: "ChannelPartner"
            },
            channelName: {
                type: String,
                required: false
            },
            channelCurrency: {
                type: String,
                required: false
            },
            spin: {
                type: String,
                required: false
            },
            uom1: {
                type: String,
                required: false
            },
            uom2: {
                type: String,
                required: false
            },
            stdCostUom1: {
                type: Number,
                set: value => setTwoDecimal(value, 3),
                required: false,
                default: 0
            },
            stdCostUom2: {
                type: Number,
                set: value => setTwoDecimal(value, 3),
                required: false,
                default: 0
            },
            primaryUnit: {
                type: String,
                required: false
            },
            secondaryUnit: {
                type: String,
                required: false
            },
            channelPrice: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false,
                default: 0
            },
            channelBenchmarkPrice: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false,
                default: 0
            },
            primaryChannel: {
                type: String,
                required: false
            },
            uomPurchaseCost: {
                type: String,
                required: false
            }
        }
    ],
    rmSpecifications: [
        {
            parameter: {
                type: String,
                required: false
            },
            testMethod: {
                type: String,
                required: false
            },
            specification: {
                type: String,
                required: false
            }
        }
    ],
    inventoryStockLevels: {
        maxConsumptionPerDay: {
            type: Number,
            required: false
        },
        minConsumptionPerDay: {
            type: Number,
            required: false
        },
        avgConsumptionPerDay: {
            type: Number,
            required: false
        },
        supplyLeadTime: {
            type: Number,
            required: false
        },
        inventoryTurnoverCycle: {
            type: Number,
            required: false
        },
        noOfOrdersPerCycle: {
            type: Number,
            required: false
        },
        reorderLevel: {
            type: Number,
            required: false
        },
        reorderQuantity: {
            type: Number,
            required: false
        },
        maximumStockLevel: {
            type: Number,
            required: false
        },
        averageStockLevel: {
            type: Number,
            required: false
        },
        minimumStockLevel: {
            type: Number,
            required: false
        }
    },
    dualUnitsDimensionsDetails: {
        type: {
            type: String,
            required: false
        },
        width: {
            type: Number,
            required: false
        },
        length: {
            type: Number,
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
        widthInMM: {
            type: Number,
            required: false
        },
        lengthInM: {
            type: Number,
            required: false
        },
        sqmPerRoll: {
            type: Number,
            required: false
        }
    }
    // specificationInfo: [
    //     {
    //         seq: {
    //             type: Number,
    //             required: false
    //         },
    //         specificationCode: {
    //             type: String,
    //             required: false
    //         },
    //         characteristic: {
    //             type: String,
    //             required: false
    //         },
    //         UOM: {
    //             type: String,
    //             required: false
    //         },
    //         testStandard: {
    //             type: String,
    //             required: false
    //         },
    //         measuringInstrument: {
    //             type: String,
    //             required: false
    //         },
    //         specValue: {
    //             type: String,
    //             required: false
    //         },
    //         tolerance: {
    //             type: Number,
    //             set: value => {
    //                 if (![undefined, null, "NaN"].includes(value) && typeof value == "number") {
    //                     return parseFloat(value).toFixed(2);
    //                 }
    //             },
    //             required: false
    //         }
    //     }
    // ]
};
