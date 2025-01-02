const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {JOB_WORK_ITEM_MASTER: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/purchaseConstant");
const {paginatePlugin, reportPaginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const {setTwoDecimal, getIncrementNumWithPrefix} = require("../../helpers/utility");
const {
    getAllProdItemCategory,
    setProdItemNextAutoIncrementNo
} = require("../../controllers/v1/settings/prodItemCategory/prodItemCategory");
const {PROD_ITEM_CATEGORY_TYPE} = require("../../mocks/constantData");
const {ObjectId} = require("../../../config/mongoose");

const jobWorkItemMasterSchema = new mongoose.Schema(
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
        itemCategory: {
            type: String,
            required: false
        },
        jobWorkItemCode: {
            type: String,
            required: false
        },
        jobWorkItemName: {
            type: String,
            required: false
        },
        jobWorkItemDescription: {
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
        },
        HSN: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "HSN"
        },
        HSNCode: {
            type: Number,
            required: false
        },
        STDBatchQuantity: {
            type: Number,
            required: false
        },
        BOMLevel: {
            type: String,
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
        shelfLife: {
            type: Number,
            required: false
        },
        QCLevels: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
            default: OPTIONS.defaultStatus.ACTIVE
        },
        // jobWorkerDetails: [
        //     {
        //         jobWorker: {
        //             type: mongoose.Schema.Types.ObjectId,
        //             required: false,
        //             ref: "Supplier"
        //         },
        //         jobWorkerName: {
        //             type: String,
        //             required: false
        //         },
        //         UOM: {
        //             type: String,
        //             required: false
        //         },
        //         currency: {
        //             type: String,
        //             required: false
        //         },
        //         materialCost: {
        //             type: Number,
        //             set: value => setTwoDecimal(value, 3),
        //             required: false,
        //             default: 0
        //         },
        //         manufacturingCost: {
        //             type: Number,
        //             set: value => setTwoDecimal(value, 3),
        //             required: false,
        //             default: 0
        //         },
        //         totalJWItemCost: {
        //             type: Number,
        //             set: value => setTwoDecimal(value, 3),
        //             required: false,
        //             default: 0
        //         }
        //     }
        // ],
        JWItemStockLevels: {
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
                jobWorkItemCode: {
                    type: String,
                    required: false
                },
                jobWorkItemName: {
                    type: String,
                    required: false
                },
                jobWorkItemDescription: {
                    type: String,
                    required: false
                },
                orderInfoUOM: {
                    type: String,
                    required: false
                },
                itemCategory: {
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
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

jobWorkItemMasterSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (ObjectId.isValid(this.HSN)) {
        this.revisionHistory.push({
            jobWorkItemCode: this.jobWorkItemCode,
            jobWorkItemName: this.jobWorkItemName,
            jobWorkItemDescription: this.jobWorkItemDescription,
            orderInfoUOM: this.orderInfoUOM,
            itemCategory: this.itemCategory,
            HSN: this.HSN,
            HSNCode: this.HSNCode,
            status: this.status,
            revisionInfo: this.revisionInfo
        });
    }
    if (this.isNew) {
        const itemCategoryList = await getAllProdItemCategory([
            {
                $match: {
                    type: PROD_ITEM_CATEGORY_TYPE.JW_ITEM,
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE
                }
            }
        ]);
        let category = itemCategoryList.find(x => this.itemCategory == x.category);
        if (!!category) {
            this.jobWorkItemCode = getIncrementNumWithPrefix({
                modulePrefix: category.prefix,
                autoIncrementValue: category.nextAutoIncrement,
                digit: category.digit
            });
            await setProdItemNextAutoIncrementNo(this.itemCategory, PROD_ITEM_CATEGORY_TYPE.JW_ITEM);
        }
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
jobWorkItemMasterSchema.plugin(paginatePlugin);
jobWorkItemMasterSchema.plugin(reportPaginatePlugin);
const jobWorkItemMaster = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, jobWorkItemMasterSchema);

module.exports = jobWorkItemMaster;
const auditTrail = async (master, modifiedPaths, isNew, isModified) => {
    const {createdBy, updatedBy, company} = master;
    const auditTrail = {
        company: company,
        oldData: JSON.stringify(await master.constructor.findById(master._id)),
        data: JSON.stringify(master),
        user: isNew ? createdBy : updatedBy, // Replace with the actual current user's name
        action: isNew ? SCHEMA_CONSTANT.ADDED_ACTION : SCHEMA_CONSTANT.UPDATED_ACTION,
        fieldsModified: modifiedPaths.toString()
    };
    await Audit.auditModule(auditTrail);
};
