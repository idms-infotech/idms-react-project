const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {PROSPECT_SUPPLIER: SCHEMA_CONSTANT} = require("../../mocks/schemasConstant/purchaseConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const prospectSupplierSchema = new mongoose.Schema(
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
        regNo: {
            type: String,
            required: false
        },
        regDate: {
            type: Date,
            required: false
        },
        supplierPurchaseType: {
            type: String,
            required: false
        },
        categoryType: {
            type: String,
            required: false
        },
        supplierName: {
            type: String,
            required: false
        },
        supplierNickName: {
            type: String,
            required: false
        },
        GSTClassification: {
            type: String,
            required: false
        },
        supplierGST: {
            type: String,
            required: false
        },
        supplierPAN: {
            type: String,
            required: false
        },
        supplierPaymentTerms: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: false,
            enum: OPTIONS.defaultStatus.getCommonStatusAsArray()
        },
        supplierBillingAddress: [
            {
                line1: {
                    type: String,
                    required: false,
                    trim: false
                },
                line2: {
                    type: String,
                    required: false,
                    trim: false
                },
                line3: {
                    type: String,
                    required: false,
                    trim: false
                },
                line4: {
                    type: String,
                    required: false,
                    trim: false
                },
                state: {
                    type: String,
                    required: false,
                    trim: false
                },
                city: {
                    type: String,
                    required: false,
                    trim: false
                },
                district: {
                    type: String,
                    required: false,
                    trim: false
                },
                pinCode: {
                    type: String,
                    required: false,
                    trim: false
                },
                country: {
                    type: String,
                    required: false,
                    trim: false
                },
                zone: {
                    type: String,
                    required: false,
                    trim: false
                }
            }
        ],
        supplierShippingAddress: [
            {
                line1: {
                    type: String,
                    required: false,
                    trim: false
                },
                line2: {
                    type: String,
                    required: false,
                    trim: false
                },
                line3: {
                    type: String,
                    required: false,
                    trim: false
                },
                state: {
                    type: String,
                    required: false,
                    trim: false
                },
                city: {
                    type: String,
                    required: false,
                    trim: false
                },
                district: {
                    type: String,
                    required: false,
                    trim: false
                },
                pinCode: {
                    type: String,
                    required: false,
                    trim: false
                },
                country: {
                    type: String,
                    required: false,
                    trim: false
                },
                zone: {
                    type: String,
                    required: false,
                    trim: false
                }
            }
        ],
        supplierContactMatrix: [
            {
                supplierContactPersonName: {
                    type: String,
                    required: false
                },
                supplierContactPersonDesignation: {
                    type: String,
                    required: false
                },
                supplierContactPersonDepartment: {
                    type: String,
                    required: false,
                    default: "Others"
                },
                supplierContactPersonNumber: {
                    type: String,
                    required: false
                },
                supplierContactPersonAltNum: {
                    type: String,
                    required: false
                },
                supplierContactPersonEmail: {
                    type: String,
                    required: false
                },
                supplierTelNo: {
                    type: String,
                    required: false
                }
            }
        ],
        supplierAssessmentRemarks: {
            prodAndServ: {
                type: String,
                required: false
            },
            costCompetitiveness: {
                type: String,
                required: false
            },
            supplyChainEff: {
                type: String,
                required: false
            },
            QMSCert: {
                type: String,
                required: false
            },
            responsivenessAndCommunication: {
                type: String,
                required: false
            },
            supplierAuditScore: {
                type: String,
                required: false
            }
        },
        supplierStatus: {
            type: String,
            required: false,
            enum: [OPTIONS.defaultStatus.CREATED, OPTIONS.defaultStatus.REJECTED, OPTIONS.defaultStatus.APPROVED],
            default: OPTIONS.defaultStatus.CREATED
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONSTANT.COLLECTION_NAME
    }
);

prospectSupplierSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.regNo = await getAndSetAutoIncrementNo(SCHEMA_CONSTANT.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
prospectSupplierSchema.plugin(paginatePlugin);
const ProspectSupplier = mongoose.model(SCHEMA_CONSTANT.COLLECTION_NAME, prospectSupplierSchema);

module.exports = ProspectSupplier;
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
