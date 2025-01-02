const mongoose = require("mongoose");
const {CONSTANTS} = require("../../../config/config");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {COMPANY: SCHEMA_CONST} = require("../../mocks/schemasConstant/settingsConstant");
const companySchema = new mongoose.Schema(
    {
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "User"
        },
        companyCode: {
            type: String,
            required: false
        },
        companyName: {
            type: String,
            required: true
        },
        companyNickName: {
            type: String,
            required: false
        },
        constitutionOfBusiness: {
            type: String,
            required: false
        },
        companyCIN: {
            type: String,
            required: false
        },
        dateOfIncorporation: {
            type: Date,
            required: false,
            default: new Date()
        },
        companyPAN: {
            type: String,
            required: true
        },
        GSTIN: {
            type: String,
            required: true
        },
        GSTClassification: {
            type: String,
            required: false
        },
        companyMSMENo: {
            type: String,
            required: false
        },
        udyamRegistrationNo: {
            type: String,
            required: false
        },
        importExportIECode: {
            type: String,
            required: false
        },
        TANForTDSTCS: {
            type: String,
            required: false
        },
        contactInfo: [
            {
                department: {
                    type: String,
                    required: false
                },
                contactPersonName: {
                    type: String,
                    required: false
                },
                designation: {
                    type: String,
                    required: false
                },
                companyContactPersonNumber: {
                    type: String,
                    required: false
                },
                companyContactPersonAltNum: {
                    type: String,
                    required: false
                },
                companyContactPersonEmail: {
                    type: String,
                    required: false
                },
                companyTelNo: {
                    type: String,
                    required: false
                }
            }
        ],
        companyBillingAddress: {
            addressType: {
                type: String,
                required: false,
                trim: true,
                default: "Billing"
            },
            addressLine1: {
                type: String,
                required: false,
                trim: true
            },
            addressLine2: {
                type: String,
                required: false,
                trim: true
            },
            addressLine3: {
                type: String,
                required: false,
                trim: true
            },
            addressLine4: {
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
            district: {
                type: String,
                required: false,
                trim: true
            },
            pinCode: {
                type: String,
                required: false,
                trim: true
            },
            country: {
                type: String,
                required: false,
                trim: true
            }
        },
        placesOfBusiness: [
            {
                locationID: {
                    type: String,
                    required: true
                },
                stateForAdditionalPlaceOfBusiness: {
                    type: String,
                    required: false
                },
                GSTINForAdditionalPlace: {
                    type: String,
                    required: false
                },
                TAN: {
                    type: String,
                    required: false
                },
                SOPdfHeader: {
                    type: String,
                    required: false
                },
                SOSignature: {
                    type: String,
                    required: false
                },
                PISignature: {
                    type: String,
                    required: false
                },
                DCSignature: {
                    type: String,
                    required: false
                },
                TISignature: {
                    type: String,
                    required: false
                },
                addressLine1: {
                    type: String,
                    required: false,
                    trim: true
                },
                addressLine2: {
                    type: String,
                    required: false,
                    trim: true
                },
                addressLine3: {
                    type: String,
                    required: false,
                    trim: true
                },
                addressLine4: {
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
                district: {
                    type: String,
                    required: false,
                    trim: true
                },
                pinCode: {
                    type: String,
                    required: false,
                    trim: true
                },
                country: {
                    type: String,
                    required: false,
                    trim: true
                }
            }
        ],
        accountsDetails: {
            reportingCurrency: {
                type: String,
                required: false
            },
            currencySymbol: {
                type: String,
                required: false
            },
            fiscalYearStartMonth: {
                type: Number,
                required: false
            },
            fiscalYearStartDays: {
                type: Number,
                required: false
            },
            fiscalYearEndMonth: {
                type: Number,
                required: false
            },
            fiscalYearEndDays: {
                type: Number,
                required: false
            },
            totalWeeklyWorkingDays: {
                type: Number,
                required: false
            }
        },
        companyBefName: {
            type: String,
            required: false
        },
        companyBankName: {
            type: String,
            required: false
        },
        companyAccountNumber: {
            type: String,
            required: false
        },
        companyAccType: {
            type: String,
            required: false
        },
        companyBankIFSCCode: {
            type: String,
            required: false
        },
        companyBankBranch: {
            type: String,
            required: false
        },
        companyBankAddress: {
            type: String,
            required: false
        },
        companyBankMICRCode: {
            type: String,
            required: false
        },
        exports: {
            //Yes ,No
            type: String,
            required: false,
            default: "No"
        },
        swiftCode: {
            type: String,
            required: false
        },
        intermediaryBank: {
            type: String,
            required: false
        },
        intermediaryBankSwiftCode: {
            type: String,
            required: false
        },
        isCompanyActive: {
            type: Boolean,
            required: false
        },
        logo: {
            type: String,
            required: false
        },
        landingPageHeader: {
            type: String,
            required: false
        },
        welcomeInfo: {
            type: String,
            required: false
        },
        companyPdfHeader: {
            type: String,
            required: false
        },
        SOPdfHeader: {
            type: String,
            required: false
        },
        registerOfficePOHeader: {
            type: String,
            required: false
        },
        registerOfficeSOHeader: {
            type: String,
            required: false
        },
        factoryPOHeader: {
            type: String,
            required: false
        },
        factorySOHeader: {
            type: String,
            required: false
        },
        companySignature: {
            type: String,
            required: false
        },
        SOSignature: {
            type: String,
            required: false
        },
        PODomesticTemplates: {
            type: String,
            required: false
        },
        POImportsTemplates: {
            type: String,
            required: false
        },
        PIDomesticTemplates: {
            type: String,
            required: false
        },
        PIExportsTemplates: {
            type: String,
            required: false
        },
        TIDomesticTemplates: {
            type: String,
            required: false
        },
        TIExportsTemplates: {
            type: String,
            required: false
        },
        companyCategory: {
            type: String,
            required: false
        },
        companyUdyogAadhar: {
            type: String,
            required: false
        },
        companyURD: {
            type: String,
            required: false
        },
        companyWebsite: {
            type: String,
            required: false
        },
        companyType: {
            type: String,
            required: false
            // Printing Industry,Automobile Industry
        },
        exportsDetails: {
            LUTNo: {
                type: String,
                required: false
            },
            LUTDate: {
                type: Date,
                required: false
            },
            LUTDocument: {
                type: String,
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

companySchema.set("toJSON", {virtuals: true});

companySchema.virtual("exportsDetails.LUTDocumentUrl").get(function () {
    if (this.exportsDetails.LUTDocument && this.exportsDetails.LUTDocument != "undefined") {
        return CONSTANTS.domainUrl + "company/" + this.exportsDetails.LUTDocument;
    }
});
companySchema.virtual("logoUrl").get(function () {
    if (this.logo && this.logo != "undefined") {
        return CONSTANTS.domainUrl + "company/" + this.logo;
    }
});
companySchema.virtual("landingPageHeaderUrl").get(function () {
    if (this.landingPageHeader && this.landingPageHeader != "undefined") {
        return CONSTANTS.domainUrl + "company/" + this.landingPageHeader;
    }
});
companySchema.virtual("welcomeInfoUrl").get(function () {
    if (this.welcomeInfo && this.welcomeInfo != "undefined") {
        return CONSTANTS.domainUrl + "company/" + this.welcomeInfo;
    }
});
companySchema.virtual("companyPdfHeaderUrl").get(function () {
    if (this.companyPdfHeader && this.companyPdfHeader != "undefined") {
        return CONSTANTS.domainUrl + "company/" + this.companyPdfHeader;
    }
});
companySchema.virtual("SOPdfHeaderUrl").get(function () {
    if (this.SOPdfHeader && this.SOPdfHeader != "undefined") {
        return CONSTANTS.domainUrl + "company/" + this.SOPdfHeader;
    }
});
// companySchema.virtual("registerOfficePOHeaderUrl").get(function () {
//     if (this.registerOfficePOHeader && this.registerOfficePOHeader != "undefined") {
//         return CONSTANTS.domainUrl + "company/" + this.registerOfficePOHeader;
//     }
// });
// companySchema.virtual("registerOfficeSOHeaderUrl").get(function () {
//     if (this.registerOfficeSOHeader && this.registerOfficeSOHeader != "undefined") {
//         return CONSTANTS.domainUrl + "company/" + this.registerOfficeSOHeader;
//     }
// });
// companySchema.virtual("factoryPOHeaderUrl").get(function () {
//     if (this.factoryPOHeader && this.factoryPOHeader != "undefined") {
//         return CONSTANTS.domainUrl + "company/" + this.factoryPOHeader;
//     }
// });
// companySchema.virtual("factorySOHeaderUrl").get(function () {
//     if (this.factorySOHeader && this.factorySOHeader != "undefined") {
//         return CONSTANTS.domainUrl + "company/" + this.factorySOHeader;
//     }
// });
companySchema.virtual("companySignatureUrl").get(function () {
    if (this.companySignature && this.companySignature != "undefined") {
        return CONSTANTS.domainUrl + "company/" + this.companySignature;
    }
});
companySchema.virtual("SOSignatureUrl").get(function () {
    if (this.SOSignature && this.SOSignature != "undefined") {
        return CONSTANTS.domainUrl + "company/" + this.SOSignature;
    }
});
companySchema.virtual("PISignatureUrl").get(function () {
    if (this.PISignature && this.PISignature != "undefined") {
        return CONSTANTS.domainUrl + "company/" + this.PISignature;
    }
});
companySchema.virtual("DCSignatureUrl").get(function () {
    if (this.DCSignature && this.DCSignature != "undefined") {
        return CONSTANTS.domainUrl + "company/" + this.DCSignature;
    }
});
companySchema.virtual("TISignatureUrl").get(function () {
    if (this.TISignature && this.TISignature != "undefined") {
        return CONSTANTS.domainUrl + "company/" + this.TISignature;
    }
});

companySchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
const Company = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, companySchema);
module.exports = Company;

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
// Here is the classification so far –

// Turnover less than 5 CR – Attach the first format that I sent today (For – Decal Tech)
// – Attach the Second format that I sent today (For – AA’s Ad Aids)
// E-Invoice – Attach the format in this mail (For – Waco, Vega.  Most IDMS customers will fall into this category)
