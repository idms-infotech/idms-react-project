const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {BATCH_CARD: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/planningConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const ProductionUnitConfigRepository = require("./repository/productionUnitConfigRepository");
const {setTwoDecimal, getIncrementNumWithPrefix} = require("../../helpers/utility");
const {filteredSubModuleManagementList} = require("../settings/repository/subModuleRepository");
const {ObjectId} = require("../../../config/mongoose");
const batchCardSchema = new mongoose.Schema(
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
        item: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "ProductionItem"
        },
        itemCategory: {
            type: String,
            required: false
        },
        productionUnit: {
            type: String,
            required: false
        },
        prodUnitConfig: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "ProductionUnitConfig"
        },
        batchCardNo: {
            type: String,
            required: false
        },
        batchCardDate: {
            type: Date,
            required: false
        },
        batchCode: {
            type: String,
            required: false
        },
        MF: {
            type: Number,
            required: false,
            set: value => setTwoDecimal(value),
            default: 0
        },
        // SOH: {
        //     type: Number,
        //     required: false,
        //     set: value => setTwoDecimal(value),
        //     default: 0
        // },
        batchQty: {
            type: Number,
            required: false,
            set: value => setTwoDecimal(value),
            default: 0
        },
        status: {
            type: String,
            required: false,
            enum: [
                OPTIONS.defaultStatus.CREATED,
                OPTIONS.defaultStatus.APPROVED,
                OPTIONS.defaultStatus.CLOSED,
                OPTIONS.defaultStatus.CANCELLED
            ],
            default: OPTIONS.defaultStatus.CREATED
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

batchCardSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        let prodUnitData = await ProductionUnitConfigRepository.getDocById(this.prodUnitConfig, {
            prodUnitCode: 1,
            batchIncNum: 1
        });
        const featureConfig = await filteredSubModuleManagementList([
            {
                $match: {
                    _id: ObjectId("66e424b951c5a64a09522902")
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
        if (featureConfig?.length) {
            prodUnitData.prodUnitCode = `${prodUnitData?.prodUnitCode}${
                featureConfig.find(z => z?.featureCode == "MONTH_IN_BATCH_CARD_NO")?.value == "true"
                    ? "/" + String(new Date().getMonth() + 1).padStart(2, "0")
                    : ""
            }`;
        }
        this.batchCardNo = getIncrementNumWithPrefix({
            modulePrefix: `${prodUnitData?.prodUnitCode}/`,
            autoIncrementValue: prodUnitData?.batchIncNum ?? 1,
            digit: 4
        });
        await ProductionUnitConfigRepository.findAndUpdateDoc(
            {_id: this.prodUnitConfig},
            {
                $inc: {
                    batchIncNum: 1
                }
            }
        );
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
batchCardSchema.plugin(paginatePlugin);
const BatchCard = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, batchCardSchema);

module.exports = BatchCard;
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
