const mongoose = require("mongoose");
const Audit = require("../../../controllers/v1/settings/audit/audit");
const {OPTIONS} = require("../../../helpers/global.options");
const {BOM_OF_SKU: SCHEMA_CONST} = require("../../../mocks/schemasConstant/planningConstant");
const {paginatePlugin} = require("../../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../../helpers/utility");
const BoMOfSKUSchema = new mongoose.Schema(
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
        SKU: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "SKUMaster"
        },
        documentDetails: [
            {
                documentNo: {
                    type: String,
                    required: false
                },
                documentDate: {
                    type: Date,
                    required: false,
                    default: new Date()
                },
                revisionNo: {
                    type: String,
                    required: false
                },
                revisionDate: {
                    type: Date,
                    required: false,
                    default: new Date()
                },
                docCreatedBy: {
                    type: String,
                    required: false
                },
                docApprovedBy: {
                    type: String,
                    required: false
                },
                QMSDocumentNo: {
                    type: String,
                    required: false
                },
                reasonForRevision: {
                    type: String,
                    required: false
                }
            }
        ],
        SKUCode: {
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
        UOM: {
            type: String,
            required: false
        },
        partCount: {
            type: Number,
            set: value => setTwoDecimal(value, 3),
            required: false
        },
        drawingNo: {
            type: String,
            required: false
        },
        BOMOfSKUDetails: [
            {
                reference: {
                    type: mongoose.Schema.Types.ObjectId,
                    refPath: "referenceModel"
                },
                referenceModel: {
                    enum: ["ProductionItem", "Items", "InkMaster", "ChildItem", "JobWorkItemMaster"],
                    type: String
                },
                type: {
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
                UOM: {
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
                supplierPartNo: {
                    type: String,
                    required: false
                },
                primaryToSecondaryConversion: {
                    type: Number,
                    set: value => setTwoDecimal(value, 3),
                    required: false
                },
                ups: {
                    type: Number,
                    required: false
                },
                width: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                length: {
                    type: Number,
                    set: value => setTwoDecimal(value, 3),
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
                oldQtyPerPC: {
                    type: Number,
                    set: value => setTwoDecimal(value, 4),
                    required: false
                },
                qtyPerSKUUnit: {
                    type: Number,
                    set: value => setTwoDecimal(value, 4),
                    required: false
                },
                layoutDimArea: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                wastePercentage: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                partCount: {
                    type: Number,
                    set: value => setTwoDecimal(value, 3),
                    required: false
                },
                unitCost: {
                    type: Number,
                    set: value => setTwoDecimal(value, 3),
                    required: false
                },
                itemCost: {
                    type: Number,
                    set: value => setTwoDecimal(value, 3),
                    required: false
                },
                BOM: {
                    type: String,
                    required: false
                },
                refDesignator: {
                    type: String,
                    required: false
                },
                BOMLevel: {
                    type: String,
                    required: false
                }
            }
        ],
        totalMaterialCost: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        materialCostForOnePC: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        isColorInfo: {
            type: Boolean,
            required: false,
            default: false
        },
        status: {
            type: String,
            required: false,
            default: OPTIONS.defaultStatus.ACTIVE
        },
        BOMStatus: {
            type: String,
            required: false,
            enum: [OPTIONS.defaultStatus.CREATED, OPTIONS.defaultStatus.APPROVED],
            default: OPTIONS.defaultStatus.CREATED
        },
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

BoMOfSKUSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    this.revisionHistory.push({
        BOMNo: this.BOMNo,
        SKU: this.SKU,
        SKUCode: this.SKUCode,
        SKUName: this.SKUName,
        SKUDescription: this.SKUDescription,
        UOM: this.UOM,
        partCount: this.partCount,
        drawingNo: this.drawingNo,
        BOMOfSKUDetails: this.BOMOfSKUDetails,
        totalMaterialCost: this.totalMaterialCost,
        materialCostForOnePC: this.materialCostForOnePC,
        isColorInfo: this.isColorInfo,
        status: this.status,
        BOMStatus: this.BOMStatus,
        revisionInfo: this.revisionInfo
    });
    if (this.isNew) {
        // this.BOMNo = await getAndSetAutoIncrementNo({...SCHEMA_CONST.AUTO_INCREMENT_DATA()}, this.company, true);
        // let SKUCategoryData = await filteredSKUCategoryList([
        //     {
        //         $match: {
        //             displayProductCategoryName: SKUData?.productCategory,
        //             categoryStatus: OPTIONS.defaultStatus.ACTIVE
        //         }
        //     },
        //     {
        //         $project: {
        //             _id: 0,
        //             modulePrefix: "$SKUCategoryPrefix"
        //         }
        //     }
        // ]);
        // if (!SKUCategoryData.length) {
        //     SKUCategoryData = await AutoIncrementRepository.filteredAutoIncrementList([
        //         {
        //             $match: {
        //                 module: SKU_MASTER.MODULE
        //             }
        //         },
        //         {
        //             $project: {modulePrefix: 1, _id: 0}
        //         }
        //     ]);
        // }
        // let BOMPrefixObj = await AutoIncrementRepository.findOneDoc(
        //     {
        //         module: SCHEMA_CONST.MODULE,
        //         company: req.user.company
        //     },
        //     {modulePrefix: 1, _id: 0}
        // );
        // this.BOMNo = this.SKUCode?.replace(
        //     SKUCategoryData[0]?.modulePrefix,
        //     BOMPrefixObj?.modulePrefix ?? SCHEMA_CONST.MODULE_PREFIX
        // );
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

BoMOfSKUSchema.plugin(paginatePlugin);

const BoMOfSKU = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, BoMOfSKUSchema);

module.exports = BoMOfSKU;
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
