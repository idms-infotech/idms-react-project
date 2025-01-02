const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {LOGISTICS_PROVIDER: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/planningConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const {getAllLSPCategory, setLSPNextAutoIncrementNo} = require("../../controllers/v1/settings/LSPCategory/LSPCategory");
const {getIncrementNumWithPrefix} = require("../../helpers/utility");
const logisticsProviderSchema = new mongoose.Schema(
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
        LSPCategory: {
            type: String,
            required: false
        },
        categoryType: {
            type: String,
            required: false
        },
        LSPCode: {
            type: String,
            required: false
        },
        LSPName: {
            type: String,
            required: false
        },
        LSPNickName: {
            type: String,
            required: false
        },
        GSTClassification: {
            type: String,
            required: false
        },
        GSTINNo: {
            type: String,
            required: false
        },
        PANNo: {
            type: String,
            required: false
        },
        RCMApplicability: {
            type: String,
            required: false
        },
        currency: {
            type: String,
            required: false
        },
        paymentTerms: {
            type: String,
            required: false
        },
        freight: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: OPTIONS.defaultStatus.getCommonStatusAsArray(),
            default: OPTIONS.defaultStatus.ACTIVE
        },
        primaryAddress: {
            country: {
                type: String,
                required: false,
                trim: true
            },
            state: {
                type: String,
                required: false,
                trim: true
            },
            city: {
                type: String,
                required: false,
                trim: true
            },
            pinCode: {
                type: String,
                required: false,
                trim: true
            },
            line1: {
                type: String,
                required: false,
                trim: true
            },
            line2: {
                type: String,
                required: false,
                trim: true
            },
            line3: {
                type: String,
                required: false,
                trim: true
            },
            line4: {
                type: String,
                required: false,
                trim: true
            },
            zone: {
                type: String,
                required: false,
                trim: true
            }
        },
        additionalPlacesOfBusiness: [
            {
                country: {
                    type: String,
                    required: false,
                    trim: true
                },
                state: {
                    type: String,
                    required: false,
                    trim: true
                },
                city: {
                    type: String,
                    required: false,
                    trim: true
                },
                pinCode: {
                    type: String,
                    required: false,
                    trim: true
                },
                line1: {
                    type: String,
                    required: false,
                    trim: true
                },
                line2: {
                    type: String,
                    required: false,
                    trim: true
                },
                line3: {
                    type: String,
                    required: false,
                    trim: true
                },
                line4: {
                    type: String,
                    required: false,
                    trim: true
                },
                zone: {
                    type: String,
                    required: false,
                    trim: true
                }
            }
        ],
        contactDetails: [
            {
                contactPersonName: {
                    type: String,
                    required: false
                },
                department: {
                    type: String,
                    required: false
                },
                designation: {
                    type: String,
                    required: false
                },
                mobileNo: {
                    type: String,
                    required: false
                },
                emailId: {
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

logisticsProviderSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        const categoryList = await getAllLSPCategory([
            {
                $match: {
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE
                }
            }
        ]);
        if (categoryList?.length) {
            let category = categoryList.find(x => this.LSPCategory == x.category);
            if (!!category) {
                this.LSPCode = getIncrementNumWithPrefix({
                    modulePrefix: category.prefix,
                    autoIncrementValue: category.nextAutoIncrement,
                    digit: category.digit
                });
                await setLSPNextAutoIncrementNo(this.LSPCategory);
            }
        } else {
            this.LSPCode = await getAndSetAutoIncrementNo(
                {...SCHEMA_CONSTANT.AUTO_INCREMENT_DATA()},
                this.company,
                true
            );
        }
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
logisticsProviderSchema.plugin(paginatePlugin);
const logisticsProvider = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, logisticsProviderSchema);

module.exports = logisticsProvider;
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
