const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {OPTIONS} = require("../../helpers/global.options");
const {SALES_ORDER: SCHEMA_CONST} = require("../../mocks/schemasConstant/salesConstant");
const {paginatePlugin, reportPaginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal, getIncrementNumWithPrefix} = require("../../helpers/utility");
const {getAllCustomerCategory} = require("../../controllers/v1/settings/customerCategory/customerCategory");
const CustomerCategoryRepository = require("../settings/repository/customerCategoryRepository");
const {filteredSubModuleManagementList} = require("../settings/repository/subModuleRepository");
const {ObjectId} = require("../../../config/mongoose");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const salesOrderSchema = new mongoose.Schema(
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
        salesCategory: {
            type: String,
            required: false
            // imports, domestic
        },
        categoryType: {
            type: String,
            required: false
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Customer"
        },
        quotationProformaRef: {
            type: mongoose.Schema.Types.ObjectId,
            required: false
            // ref: "QuotationProformaRef",
        },
        SONumber: {
            type: String,
            required: false
        },
        SOType: {
            type: String,
            required: false,
            default: "Regular"
        },
        SODate: {
            type: Date,
            required: false,
            default: new Date()
        },
        PIId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "ProformaInvoice"
        },
        PINumber: {
            type: String,
            required: false
        },
        PIDate: {
            type: Date,
            required: false,
            default: new Date()
        },
        PONumber: {
            //orderReference
            type: String,
            required: false
        },
        PODate: {
            type: Date,
            required: false
        },
        currency: {
            type: String,
            required: false
        },
        POFileName: {
            type: String,
            required: false
        },
        SOTargetDate: {
            type: Date,
            required: false
        },
        SOTotalAmount: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        totalSPV: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        SODetails: [
            {
                SOLineNumber: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                SKU: {
                    //sku no.
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "SKUMaster"
                },
                UOM: {
                    type: String,
                    required: false
                },
                customerPartNo: {
                    type: String,
                    required: false
                },
                salesRate: {
                    // rate/unit
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                standardRate: {
                    // rate/unit
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                discount: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                netRate: {
                    // standardRate - (standardRate * discount)
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                SOLineTargetDate: {
                    type: Date,
                    required: false
                },
                orderedQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                lineValue: {
                    // orderedQty * netRate
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                invoicedQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                balancedQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                previousDRNQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                JCCQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                previousJCCQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                canceledQty: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false,
                    default: 0
                },
                canceledReason: {
                    type: String,
                    required: false
                },
                lineStatus: {
                    type: String,
                    required: false
                },
                dispatchCount: {
                    type: Number,
                    required: false
                },
                dispatchDate: {
                    type: Date,
                    required: false
                },
                dispatchSchedule: [
                    {
                        scheduleNo: {
                            type: Number,
                            required: false
                        },
                        quantity: {
                            type: Number,
                            set: value => setTwoDecimal(value),
                            required: false
                        },
                        dispatchDate: {
                            type: Date,
                            required: false
                        },
                        PPICDate: {
                            type: Date,
                            required: false
                        }
                    }
                ],
                primaryToSecondaryConversion: {
                    type: Number,
                    required: false
                },
                secondaryToPrimaryConversion: {
                    type: Number,
                    required: false
                },
                lineSPV: {
                    type: Number,
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
                        },
                        select: {
                            type: Boolean,
                            required: false
                        }
                    }
                ]
            }
        ],
        customerBillingAddress: {
            line1: {
                type: String,
                required: false,
                trim: false
            },
            line2: {
                type: String,
                required: false,
                trim: false
            },
            line3: {
                type: String,
                required: false,
                trim: false
            },
            line4: {
                type: String,
                required: false,
                trim: false
            },
            state: {
                type: String,
                required: false,
                trim: false
            },
            city: {
                type: String,
                required: false,
                trim: false
            },
            district: {
                type: String,
                required: false,
                trim: false
            },
            pinCode: {
                type: String,
                required: false,
                trim: false
            },
            country: {
                type: String,
                required: false,
                trim: false
            },
            contactPersonName: {
                type: String,
                required: false,
                trim: false
            },
            contactPersonNumber: {
                type: String,
                required: false,
                trim: false
            }
        },
        customerShippingAddress: {
            line1: {
                type: String,
                required: false,
                trim: false
            },
            line2: {
                type: String,
                required: false,
                trim: false
            },
            line3: {
                type: String,
                required: false,
                trim: false
            },
            line4: {
                type: String,
                required: false,
                trim: false
            },
            state: {
                type: String,
                required: false,
                trim: false
            },
            city: {
                type: String,
                required: false,
                trim: false
            },
            district: {
                type: String,
                required: false,
                trim: false
            },
            pinCode: {
                type: String,
                required: false,
                trim: false
            },
            country: {
                type: String,
                required: false,
                trim: false
            },
            contactPersonName: {
                type: String,
                required: false,
                trim: false
            },
            contactPersonNumber: {
                type: String,
                required: false,
                trim: false
            },
            GSTIN: {
                type: String,
                required: false,
                trim: false
            }
        },
        billFromLocation: {
            type: String,
            required: false
        },
        billFromAddress: {
            line1: {
                type: String,
                required: false,
                trim: false
            },
            line2: {
                type: String,
                required: false,
                trim: false
            },
            line3: {
                type: String,
                required: false,
                trim: false
            },
            line4: {
                type: String,
                required: false,
                trim: false
            },
            state: {
                type: String,
                required: false,
                trim: false
            },
            city: {
                type: String,
                required: false,
                trim: false
            },
            district: {
                type: String,
                required: false,
                trim: false
            },
            pinCode: {
                type: String,
                required: false,
                trim: false
            },
            country: {
                type: String,
                required: false,
                trim: false
            }
        },
        modeOfTransport: {
            type: String,
            required: false
        },
        frightCharge: {
            type: String,
            required: false
        },
        frightTerms: {
            type: String,
            required: false
        },
        transporter: {
            type: String,
            required: false
        },
        destination: {
            type: String,
            required: false
        },
        paymentTerms: {
            type: String,
            required: false
        },
        SORemarks: {
            type: String,
            required: false
        },
        SOCancellationReason: {
            type: String,
            required: false
        },
        isActive: {
            type: Boolean,
            required: false,
            default: false
        },
        otherCharges: {
            packagingAndForwarding: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false,
                default: 0
            },
            freight: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false,
                default: 0
            },
            insurance: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false,
                default: 0
            },
            loadingAndUnloading: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false,
                default: 0
            },
            miscellaneous: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false,
                default: 0
            },
            totalAmount: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false,
                default: 0
            }
        },
        SOStatus: {
            type: String,
            required: false,
            // enum: ["Created", "Invoiced", "Cancelled", "Closed", "Approved", "Report Generated"],
            enum: OPTIONS.defaultStatus.getAllSalesOrderStatusAsArray(),
            default: "Created"
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

salesOrderSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        const featureConfig = await filteredSubModuleManagementList([
            {
                $match: {
                    _id: ObjectId("655c3c393613e949b4d62022")
                }
            },
            {
                $unwind: "$featureConfig"
            },
            {
                $match: {
                    "featureConfig.status": true
                }
            },
            {
                $project: {
                    featureCode: "$featureConfig.featureCode",
                    value: "$featureConfig.value"
                }
            }
        ]);
        let SOCatFlag = featureConfig?.find(x => x?.featureCode == "SO_CATEGORIES")?.value ?? null;
        const categoryList = await getAllCustomerCategory(this.company, {
            category: 1,
            categoryType: 1,
            prefix: "$SOPrefix",
            nextAutoIncrement: "$SONextAutoIncrement",
            digit: "$SODigit"
        });
        if (categoryList?.length) {
            let category = categoryList.find(x => this.salesCategory == x.category);
            if (!!category) {
                if (SOCatFlag == "SINGLE_CATEGORY") {
                    this.SONumber = await getAndSetAutoIncrementNo(
                        {...SCHEMA_CONST.AUTO_INCREMENT_DATA()},
                        this.company,
                        true
                    );
                } else {
                    this.SONumber = getIncrementNumWithPrefix({
                        modulePrefix: category.prefix,
                        autoIncrementValue: category.nextAutoIncrement,
                        digit: category.digit
                    });
                    await CustomerCategoryRepository.findAndUpdateDoc(
                        {
                            category: this.salesCategory
                        },
                        {$inc: {SONextAutoIncrement: 1}}
                    );
                }
            }
        }
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
salesOrderSchema.index({SOStatus: -1});
salesOrderSchema.index({SODate: -1});
salesOrderSchema.plugin(paginatePlugin);
salesOrderSchema.plugin(reportPaginatePlugin);
const SalesOrder = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, salesOrderSchema);

module.exports = SalesOrder;
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
