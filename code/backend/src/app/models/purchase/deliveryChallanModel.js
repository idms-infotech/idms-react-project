const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {DELIVERY_CHALLAN: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/purchaseConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const {
    getAllDCLocations,
    setDCLocNextAutoIncrementNo
} = require("../../controllers/v1/settings/deliveryChallanLoc/deliveryChallanLoc");
const {getIncrementNumWithPrefix, setTwoDecimal} = require("../../helpers/utility");
const deliveryChallanSchema = new mongoose.Schema(
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
        nameOfConsignor: {
            type: String,
            required: false
        },
        consignorAddress: {
            addressLine1: {type: String, required: false},
            addressLine2: {type: String, required: false},
            addressLine3: {type: String, required: false},
            addressLine4: {type: String, required: false},
            state: {type: String, required: false},
            city: {type: String, required: false},
            pinCode: {type: String, required: false},
            country: {type: String, required: false},
            GSTINForAdditionalPlace: {type: String, required: false}
        },
        DCNo: {
            type: String,
            required: false
        },
        DCDate: {
            type: Date,
            required: false
        },
        nameOfConsignee: {
            type: String,
            required: false
        },
        consigneeAddress: {
            addressLine1: {type: String, required: false},
            addressLine2: {type: String, required: false},
            addressLine3: {type: String, required: false},
            addressLine4: {type: String, required: false},
            state: {type: String, required: false},
            city: {type: String, required: false},
            pinCode: {type: String, required: false},
            country: {type: String, required: false},
            GSTINForAdditionalPlace: {type: String, required: false}
        },
        placeOfSupply: {
            type: String,
            required: false
        },
        itemDetails: [
            {
                IC: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "InventoryCorrection"
                },
                item: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: false,
                    ref: "referenceModel"
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
                UOM: {
                    type: String,
                    required: false
                },
                IRQty: {
                    type: Number,
                    required: false,
                    set: value => setTwoDecimal(value)
                },
                batchDate: {
                    type: Date,
                    required: false
                },
                unitRate: {
                    type: Number,
                    required: false,
                    set: value => setTwoDecimal(value)
                },
                qtyTransfer: {
                    type: Number,
                    required: false,
                    set: value => setTwoDecimal(value)
                },
                taxableAmt: {
                    type: Number,
                    required: false,
                    set: value => setTwoDecimal(value)
                }
            }
        ],
        totalGoodsValue: {
            type: Number,
            required: false,
            set: value => setTwoDecimal(value)
        },
        cancelReason: {
            type: String,
            required: false
        },
        modeOfTransport: {
            type: String,
            required: false
        },
        transporterName: {
            type: String,
            required: false
        },
        transporter: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Transporter"
        },
        vehicleNo: {
            type: String,
            required: false
        },
        remarks: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: [
                OPTIONS.defaultStatus.AWAITING_APPROVAL,
                OPTIONS.defaultStatus.APPROVED,
                OPTIONS.defaultStatus.REJECTED,
                OPTIONS.defaultStatus.REPORT_GENERATED,
                OPTIONS.defaultStatus.CLOSED
            ]
        },
        // EWay Bill
        validUpto: {
            type: String,
            required: false
        },
        ewayBillNo: {
            type: String,
            required: false
        },
        ewayBillDate: {
            type: String,
            required: false
        },
        EWayBillPdfUrl: {
            type: String,
            required: false
        },
        EWayBillQrCodeUrl: {
            type: String,
            required: false
        },
        eWayBillStatus: {
            type: String,
            required: false
        }
        // EWay Bill
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

deliveryChallanSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        const itemCategoryList = await getAllDCLocations(this.company);
        let locationObj = itemCategoryList.find(x => this.nameOfConsignor == x.location);
        if (!!locationObj) {
            this.itemCode = getIncrementNumWithPrefix({
                modulePrefix: locationObj.prefix,
                autoIncrementValue: locationObj.nextAutoIncrement,
                digit: locationObj.digit
            });
            await setDCLocNextAutoIncrementNo(this.nameOfConsignor);
        }
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
deliveryChallanSchema.plugin(paginatePlugin);
const DeliveryChallan = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, deliveryChallanSchema);

module.exports = DeliveryChallan;
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
