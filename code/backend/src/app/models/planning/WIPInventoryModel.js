const mongoose = require("mongoose");
const {WIP_INVENTORY: SCHEMA_CONST} = require("../../mocks/schemasConstant/planningConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const WIPInventorySchema = new mongoose.Schema(
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
        MRN: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "MRN"
        },
        MRNNumber: {
            type: String,
            required: false
        },
        MRNDate: {
            type: Date,
            required: false
        },
        GIN: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "GoodInwardEntry"
        },
        GINDate: {
            type: Date,
            required: false
        },
        expiryDate: {
            type: Date,
            required: false
        },
        item: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Items"
        },
        itemCode: {
            type: String,
            required: false
        },
        // itemType: {
        //     type: String,
        //     required: false
        // },
        itemName: {
            type: String,
            required: false
        },
        itemDescription: {
            type: String,
            required: false
        },
        shelfLife: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        unitConversion: {
            type: String,
            required: false
        },
        UOM: {
            type: String,
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
        primaryUnit: {
            type: String,
            required: false
        },
        secondaryUnit: {
            type: String,
            required: false
        },
        PPICQty: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
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
        department: {
            type: String,
            required: false
        },
        deliveryLocation: {
            type: String,
            required: false
        },
        standardRate: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        purchaseRate: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        purchaseRateUSD: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        purchaseRatINR: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        lineValueINR: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        batchDate: {
            type: Date,
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
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
WIPInventorySchema.plugin(paginatePlugin);
const WIPInventory = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, WIPInventorySchema);

module.exports = WIPInventory;
