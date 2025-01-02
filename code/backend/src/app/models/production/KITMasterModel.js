const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {KIT_MASTER: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/productionConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin, reportPaginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const {setTwoDecimal, getAutoIncrementNumber} = require("../../helpers/utility");
const {
    getAllKITCategory,
    setKITMasterAutoIncrementNo
} = require("../../controllers/v1/settings/KITCategory/KITCategory");
const KITMasterSchema = new mongoose.Schema(
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
        KITCategory: {
            type: String,
            required: false
        },
        KITNo: {
            type: String,
            required: false
        },
        KITStage: {
            type: String,
            required: false
        },
        KITName: {
            type: String,
            required: false
        },
        KITDescription: {
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
        SKUDescription: {
            type: String,
            required: false
        },
        shelfLife: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        drawingNo: {
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
        conversionOfUnits: {
            type: String,
            required: false
        },
        unitConversionFlag: {
            type: Number,
            required: false
        },
        conversionFactor: {
            type: Number,
            set: value => setTwoDecimal(value),
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
        status: {
            type: String,
            required: false,
            enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
            default: OPTIONS.defaultStatus.ACTIVE
        },
        remarks: {
            type: String,
            required: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

KITMasterSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        const categoryList = await getAllKITCategory(this.company, this.KITCategory);
        if (!!categoryList && categoryList.length > 0) {
            this.KITNo = getAutoIncrementNumber(
                categoryList[0].categoryPrefix,
                "",
                categoryList[0].autoIncrementNo,
                categoryList[0].digit
            );
            await setKITMasterAutoIncrementNo(this.KITCategory);
        } else {
            this.KITNo = await getAndSetAutoIncrementNo({...SCHEMA_CONSTANT.AUTO_INCREMENT_DATA()}, this.company, true);
        }
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
KITMasterSchema.plugin(paginatePlugin);
KITMasterSchema.plugin(reportPaginatePlugin);
const KITMaster = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, KITMasterSchema);

module.exports = KITMaster;
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
