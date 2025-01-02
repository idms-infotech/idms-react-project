const mongoose = require("mongoose");
const Audit = require("../../../controllers/v1/settings/audit/audit");
const {OPTIONS} = require("../../../helpers/global.options");
const {BOM_OF_PROD_ITEM: SCHEMA_CONST} = require("../../../mocks/schemasConstant/planningConstant");
const {paginatePlugin} = require("../../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../../helpers/utility");
const prodItemStdCostRepository = require("../repository/prodItemStdCostRepository");
const schema = new mongoose.Schema(
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
        BOMNo: {
            type: String,
            required: false
        },
        item: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "ProductionItem"
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
        partCount: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        totalBatchQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        totalMaterialCost: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        materialCostPerUnit: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
            default: OPTIONS.defaultStatus.ACTIVE
        },
        BOMOfProdItemDetails: [
            {
                reference: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    refPath: "referenceModel"
                },
                referenceModel: {
                    type: String,
                    required: true,
                    enum: ["ProductionItem", "Items"]
                },
                isSelect: {
                    type: Boolean,
                    required: false,
                    default: false
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
                seq: {
                    type: Number,
                    required: false
                },
                qtyPerPC: {
                    type: Number,
                    set: value => setTwoDecimal(value, 5),
                    required: false
                },
                wastePercentage: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                totalQtyPerPC: {
                    type: Number,
                    set: value => setTwoDecimal(value, 4),
                    required: false
                },
                ratePerUnit: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                itemCost: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                }
            }
        ],
        revisionInfo: {
            revisionNo: {
                type: String,
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
        revisionHistory: []
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);

schema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    this.revisionHistory.push({
        BOMNo: this.BOMNo,
        item: this.item,
        itemCode: this.itemCode,
        itemName: this.itemName,
        itemDescription: this.itemDescription,
        UOM: this.UOM,
        partCount: this.partCount,
        totalMaterialCost: this.totalMaterialCost,
        materialCostPerUnit: this.materialCostPerUnit,
        status: this.status,
        BOMOfProdItemDetails: this.BOMOfProdItemDetails,
        revisionInfo: this.revisionInfo
    });
    let itemObj = await prodItemStdCostRepository.findOneDoc({item: this.item});
    if (itemObj) {
        for (const ele of itemObj?.prodUnitDetails) {
            ele.materialCost = this.materialCostPerUnit;
            ele.prodItemCost = this.materialCostPerUnit + ele.conversionCost;
        }
        await itemObj.save();
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

schema.plugin(paginatePlugin);

const BOMOfProdItem = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, schema);

module.exports = BOMOfProdItem;
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
