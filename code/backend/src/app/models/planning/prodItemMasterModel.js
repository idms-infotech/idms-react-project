const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {
    getAllProdItemCategory,
    setProdItemNextAutoIncrementNo
} = require("../../controllers/v1/settings/prodItemCategory/prodItemCategory");
const {getIncrementNumWithPrefix, setTwoDecimal} = require("../../helpers/utility");
const {OPTIONS} = require("../../helpers/global.options");
const {PROD_ITEM_MASTER: SCHEMA_CONST} = require("../../mocks/schemasConstant/planningConstant");
const {paginatePlugin, reportPaginatePlugin} = require("../plugins/paginatePlugin");
const {PROD_ITEM_CATEGORY_TYPE} = require("../../mocks/constantData");
const {ObjectId} = require("../../../config/mongoose");
const schema = new mongoose.Schema(
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
        prodItemCategory: {
            type: String,
            required: false
        },
        // BOMLevel: {
        //     type: String,
        //     required: false
        // },
        STDBatchQty: {
            type: String,
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
        unitOfMeasurement: {
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
        HSN: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "HSN"
        },
        HSNCode: {
            type: String,
            required: false
        },
        shelfLife: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        prodUnitId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "ProductionUnitConfig"
        },
        inwardTo: {
            type: String,
            required: false
        },
        invZone: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "InvZoneConfig"
        },
        unitConversionFlag: {
            type: Number,
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
            default: OPTIONS.defaultStatus.ACTIVE
        },
        stockLevels: {
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
            // },
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
        revisionInfo: {
            revisionNo: {
                type: Number,
                required: false
            },
            revisionDate: {
                type: Date,
                required: false
            },
            reasonForRevision: {
                type: String,
                required: false
            },
            revisionProposedBy: {
                type: String,
                required: false
            },
            revisionApprovedBy: {
                type: String,
                required: false
            }
        },
        revisionHistory: [
            {
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
                UOM: {
                    type: String,
                    required: false
                },
                prodItemCategory: {
                    type: String,
                    required: false
                },
                HSN: {
                    type: String,
                    required: false
                },
                HSNCode: {
                    type: String,
                    required: false
                },
                status: {
                    type: String,
                    required: false
                },
                revisionInfo: {
                    revisionNo: {
                        type: Number,
                        required: false
                    },
                    revisionDate: {
                        type: Date,
                        required: false
                    },
                    reasonForRevision: {
                        type: String,
                        required: false
                    },
                    revisionProposedBy: {
                        type: String,
                        required: false
                    },
                    revisionApprovedBy: {
                        type: String,
                        required: false
                    }
                }
            }
        ]
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

schema.pre("save", async function (next) {
    const {isNew, isModified} = this;

    if (ObjectId.isValid(this.HSN)) {
        this.revisionHistory.push({
            itemCode: this.itemCode,
            itemName: this.itemName,
            itemDescription: this.itemDescription,
            UOM: this.unitOfMeasurement,
            prodItemCategory: this.prodItemCategory,
            HSN: this.HSN,
            HSNCode: this.HSNCode,
            status: this.status,
            revisionInfo: this.revisionInfo
        });
    }

    if (this.isNew) {
        const categoryList = await getAllProdItemCategory([
            {
                $match: {
                    type: PROD_ITEM_CATEGORY_TYPE.PRODUCTION_ITEM,
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE
                }
            }
        ]);
        let category = categoryList.find(x => this.prodItemCategory == x.category);
        if (!!category) {
            this.itemCode = getIncrementNumWithPrefix({
                modulePrefix: category.prefix,
                autoIncrementValue: category.nextAutoIncrement,
                digit: category.digit
            });
            await setProdItemNextAutoIncrementNo(this.prodItemCategory, PROD_ITEM_CATEGORY_TYPE.PRODUCTION_ITEM);
        }
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

schema.plugin(paginatePlugin);
schema.plugin(reportPaginatePlugin);
const ProductionItem = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, schema);

module.exports = ProductionItem;
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
