const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {INVENTORY_CORRECTION: SCHEMA_CONST} = require("../../mocks/schemasConstant/storesConstant");
const {paginatePlugin, reportPaginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const {GOODS_TRANSFER_REQUEST_DEPT, INV_FORM_TYPE, PO_RATE_DECIMAL} = require("../../mocks/constantData");
const inventoryCorrectionSchema = new mongoose.Schema(
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
        ICDate: {
            type: Date,
            required: false,
            default: new Date()
        },
        GINDate: {
            type: Date,
            required: true,
            default: new Date()
        },
        GIN: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "GoodInwardEntry"
        },
        MRN: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "refMRN"
        },
        refMRN: {
            type: String,
            enum: ["MRN", "MaterialRevalidation", "DeliveryChallan"],
            default: "MRN"
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            refPath: "referenceModelSC"
        },
        referenceModelSC: {
            type: String,
            enum: ["Customer", "Supplier"],
            default: "Supplier"
        },
        supplierName: {
            type: String,
            required: false
        },
        MRNNumber: {
            type: String,
            required: false
        },
        MRNDate: {
            type: Date,
            required: false
        },
        ICStatus: {
            type: String,
            required: false,
            default: "IC Created"
        },
        // GINLineNumber: {
        //     type: Number,
        //     required: false
        // },
        UOM: {
            type: String,
            required: true
        },
        primaryToSecondaryConversion: {
            type: Number,
            required: false
        },
        secondaryToPrimaryConversion: {
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
        conversionOfUnits: {
            type: String,
            required: false
        },
        item: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            refPath: "referenceModel"
        },
        referenceModel: {
            enum: ["ProductionItem", "Items", "ChildItem"],
            type: String,
            default: "Items"
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
        itemType: {
            type: String,
            required: false
        },
        // itemSubCategory: {
        //     type: String,
        //     required: false,
        //     default: "General"
        // },
        // openIRQty: {
        //     type: Number,
        //     set: value => setTwoDecimal(value),
        //     required: false
        // },
        updatedQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        closedIRQty: {
            type: Number,
            set: value => setTwoDecimal(value, 3),
            required: false
        },
        standardRate: {
            type: Number,
            set: value => setTwoDecimal(value, PO_RATE_DECIMAL),
            required: false
        },
        purchaseRate: {
            type: Number,
            set: value => setTwoDecimal(value, PO_RATE_DECIMAL),
            required: false
        },
        invoiceRate: {
            type: Number,
            set: value => setTwoDecimal(value, PO_RATE_DECIMAL),
            required: false
        },
        purchaseRateUSD: {
            type: Number,
            set: value => setTwoDecimal(value, PO_RATE_DECIMAL),
            required: false
        },
        purchaseRatINR: {
            type: Number,
            set: value => setTwoDecimal(value, PO_RATE_DECIMAL),
            required: false
        },
        lineValueINR: {
            type: Number,
            set: value => setTwoDecimal(value, PO_RATE_DECIMAL),
            required: false
        },
        batchDate: {
            type: Date,
            required: false
        },
        deliveryLocation: {
            type: String,
            required: false
        },
        department: {
            type: String,
            required: false,
            enum: [
                GOODS_TRANSFER_REQUEST_DEPT.PLANNING,
                GOODS_TRANSFER_REQUEST_DEPT.PRODUCTION,
                GOODS_TRANSFER_REQUEST_DEPT.STORES
            ],
            default: GOODS_TRANSFER_REQUEST_DEPT.STORES
        },
        storageLocationMapping: {
            subLocation: {
                type: String,
                required: false
            },
            rowNo: {
                type: String,
                required: false
            },
            rackNo: {
                type: String,
                required: false
            },
            binNo: {
                type: String,
                required: false
            },
            otherId: {
                type: String,
                required: false
            }
        },
        type: {
            type: String,
            required: false,
            enum: ["InventoryCorrection", "SFGStock"],
            default: "InventoryCorrection"
        },
        // WIP Keys
        SQM: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        roll: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        width: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        length: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        expiryDate: {
            type: Date,
            required: false
        },
        // End WIP Keys
        // SFG Keys
        stage: {
            type: String,
            required: false
            // default: "Roll"
        },
        noOfRollsToBeSlit: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        sqmToBeProcessed: {
            type: Number,
            set: value => setTwoDecimal(value, 4),
            required: false
        },
        recovery: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        recoveryPercentage: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        wastage: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        wastagePercentage: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        previousDebitRejQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        previousRecoQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        recoQtyPlusMinus: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false,
            default: 0
        },
        entryAuthorizedBy: {
            type: String,
            required: false
        },
        productionRemarks: {
            prodRemarks: {
                type: String,
                required: false
            },
            checkedBy: {
                type: String,
                required: false
            },
            approvedBy: {
                type: String,
                required: false
            },
            approvedDate: {
                type: Date,
                required: false
            }
        },
        QARemarks: {
            QARemark: {
                type: String,
                required: false
            },
            checkedBy: {
                type: String,
                required: false
            },
            approvedBy: {
                type: String,
                required: false
            },
            approvedDate: {
                type: Date,
                required: false
            }
        },
        formType: {
            type: String,
            required: false,
            enum: [INV_FORM_TYPE.PARENT, INV_FORM_TYPE.CHILD],
            default: INV_FORM_TYPE.PARENT
        },
        departmentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "refDepartment"
        },
        refDepartment: {
            type: String,
            enum: ["InventoryDepartments", "ProductionUnitConfig"],
            default: "InventoryDepartments"
        },
        invZoneName: {
            type: String,
            required: false
        },
        departmentName: {
            type: String,
            required: false
        },
        invZoneId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "InvZoneConfig"
        },
        recoHistory: []
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
inventoryCorrectionSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.previousDebitRejQty = 0;
        this.recoHistory = [];
        this.recoQtyPlusMinus = 0;
    }
    if (this.isModified("recoQtyPlusMinus")) {
        this.recoHistory.push({
            closedIRQty: this.closedIRQty,
            previousRecoQty: this.previousRecoQty,
            recoQtyPlusMinus: this.recoQtyPlusMinus,
            entryAuthorizedBy: this.entryAuthorizedBy,
            recoDate: new Date()
        });
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
inventoryCorrectionSchema.index({ICStatus: -1});
inventoryCorrectionSchema.index({ICDate: -1});
inventoryCorrectionSchema.plugin(paginatePlugin);
inventoryCorrectionSchema.plugin(reportPaginatePlugin);
const InventoryCorrection = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, inventoryCorrectionSchema);

module.exports = InventoryCorrection;
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
