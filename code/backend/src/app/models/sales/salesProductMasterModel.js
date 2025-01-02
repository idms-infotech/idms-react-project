const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {SALES_PRODUCT_MASTER: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {setTwoDecimal} = require("../../helpers/utility");
const {OPTIONS} = require("../../helpers/global.options");
const salesProductMasterSchema = new mongoose.Schema(
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
        productMasterNo: {
            type: String,
            required: false
        },
        productCategory: {
            type: String,
            required: false
        },
        capDia: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        capHeight: {
            type: Number,
            set: value => setTwoDecimal(value),
            required: false
        },
        capFinish: {
            type: String,
            required: false
        },
        threadType: {
            type: String,
            required: false
        },
        orifice: {
            type: String,
            required: false
        },
        shoulderType: {
            type: String,
            required: false
        },
        weight: {
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
        mouldInfo: [
            {
                mould: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "MouldMaster"
                },
                mouldNo: {
                    type: String,
                    required: false
                },
                // mouldType: {
                //     type: String,
                //     required: false
                // },
                mouldName: {
                    type: String,
                    required: false
                },
                noOfCavities: {
                    type: Number,
                    set: value => setTwoDecimal(value),
                    required: false
                },
                mouldTBDDimension: {
                    type: String,
                    required: false
                },
                // TBDPerWidth: {
                //     type: Number,
                //     set: value => setTwoDecimal(value),
                //     required: false
                // },
                // TBDPerLength: {
                //     type: Number,
                //     set: value => setTwoDecimal(value),
                //     required: false
                // },
                mouldSupplier: {
                    type: String,
                    required: false
                },
                partNo: {
                    type: String,
                    required: false
                },
                select: {
                    type: Boolean,
                    required: false
                }
            }
        ],
        packingStdDetails: {
            qtyPerPrimaryPack: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            },
            qtyPerSecondaryPack: {
                type: Number,
                set: value => setTwoDecimal(value),
                required: false
            }
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

salesProductMasterSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        // this.productMasterNo = await getAndSetAutoIncrementNo(
        //     SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(),
        //     this.company,
        //     true
        // );
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
salesProductMasterSchema.plugin(paginatePlugin);
const salesProductMaster = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, salesProductMasterSchema);

module.exports = salesProductMaster;
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
