const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {CHANNEL_PARTNER: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/purchaseConstant");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const channelPartnerSchema = new mongoose.Schema(
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
        channelPartnerCategory: {
            type: String,
            required: false
        },
        CPCode: {
            type: String,
            required: true
        },
        channelPartnerName: {
            type: String,
            required: true
        },
        channelPartnerNickName: {
            type: String,
            required: false
        },
        PANNo: {
            type: String,
            required: true
        },
        GSTClassification: {
            type: String,
            required: false
        },
        GSTIN: {
            type: String,
            required: true
        },
        udyamAadhaarNo: {
            type: String,
            required: false
        },
        MSMEClassification: {
            type: String,
            required: false
        },
        currency: {
            type: String,
            required: false,
            default: "INR"
        },
        paymentTerms: {
            type: String,
            required: false
        },
        isCPActive: {
            type: String,
            required: false,
            enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
            default: OPTIONS.defaultStatus.ACTIVE
        },
        billingAddress: [
            {
                line1: {
                    type: String,
                    required: false
                },
                line2: {
                    type: String,
                    required: false
                },
                line3: {
                    type: String,
                    required: false
                },
                line4: {
                    type: String,
                    required: false
                },
                state: {
                    type: String,
                    required: false
                },
                city: {
                    type: String,
                    required: false
                },
                district: {
                    type: String,
                    required: false
                },
                pinCode: {
                    type: String,
                    required: false
                },
                country: {
                    type: String,
                    required: false
                }
            }
        ],
        shippingAddress: [
            {
                line1: {
                    type: String,
                    required: false
                },
                line2: {
                    type: String,
                    required: false
                },
                line3: {
                    type: String,
                    required: false
                },
                line4: {
                    type: String,
                    required: false
                },
                state: {
                    type: String,
                    required: false
                },
                city: {
                    type: String,
                    required: false
                },
                district: {
                    type: String,
                    required: false
                },
                pinCode: {
                    type: String,
                    required: false
                },
                country: {
                    type: String,
                    required: false
                }
            }
        ],
        contactMatrix: [
            {
                contactPersonName: {
                    type: String,
                    required: true
                },
                contactPersonDesignation: {
                    type: String,
                    required: false
                },
                contactPersonDepartment: {
                    type: String,
                    required: false,
                    default: "Others"
                },
                contactPersonNumber: {
                    type: String,
                    required: true
                },
                contactPersonAltNum: {
                    type: String,
                    required: false
                },
                contactPersonEmail: {
                    type: String,
                    required: false
                },
                telNo: {
                    type: String,
                    required: false
                }
            }
        ],
        bankDetails: [
            {
                befName: {
                    type: String,
                    required: false
                },
                bankName: {
                    type: String,
                    required: false
                },
                accountNumber: {
                    type: String,
                    required: false
                },
                accountType: {
                    type: String,
                    required: false
                },
                bankIFSCCode: {
                    type: String,
                    required: false
                },
                bankSwiftCode: {
                    type: String,
                    required: false
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

channelPartnerSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.CPCode = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
        // const ESPCategoryList = await getAllESPCategory(this.company);
        // let category = ESPCategoryList.find(x => this.channelPartnerCategory == x.category);
        // if (!!category) {
        //     this.CPCode = getIncrementNumWithPrefix({
        //         modulePrefix: category.prefix,
        //         autoIncrementValue: category.nextAutoIncrement,
        //         digit: category.digit
        //     });
        //     await setESPNextAutoIncrementNo(this.channelPartnerCategory);
        // }
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
channelPartnerSchema.plugin(paginatePlugin);
const channelPartner = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, channelPartnerSchema);

module.exports = channelPartner;
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
