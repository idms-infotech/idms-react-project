const {default: mongoose} = require("mongoose");

exports.SCHEMA = {
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
    supplierCode: {
        type: String,
        required: true,
        default: "S0001"
    },
    supplierName: {
        type: String,
        required: true
    },
    supplierPurchaseType: {
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
    MSMEClassification: {
        type: String,
        required: false
    },
    isSupplierActive: {
        type: String,
        required: false,
        enum: ["A", "I"],
        default: "A"
    },
    countryOfOrigin: {
        type: String,
        required: false
    },
    supplierCompanyType: {
        type: String,
        required: false,
        default: "PVT LTD"
    },
    supplierCIN: {
        type: String,
        required: false
    },
    supplierUdyogAadhar: {
        type: String,
        required: false
    },
    supplierGST: {
        type: String,
        required: false
    },
    supplierURD: {
        type: String,
        required: false
    },
    supplierPAN: {
        type: String,
        required: false
    },
    supplierMSMENo: {
        type: String,
        required: false
    },
    supplierVendorCode: {
        type: String,
        required: false
    },
    supplierBillingAddress: [
        {
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
    supplierShippingAddress: [
        {
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
    supplierAddress: [
        {
            addressType: {
                type: String,
                required: false,
                trim: true
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
            contactPersonName: {
                type: String,
                required: false,
                trim: true
            },
            contactPersonNumber: {
                type: String,
                required: false,
                trim: true
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
    supplierWebsite: {
        type: String,
        required: false
    },
    supplierBankDetails: [
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
    ],
    supplierCurrency: {
        type: String,
        required: false,
        default: "INR"
    },
    supplierINCOTerms: {
        type: String,
        required: false
    },
    supplierPaymentTerms: {
        type: String,
        required: false
    },
    supplierUdyam: {
        type: String,
        required: false
    },
    cpaFile: {
        type: String,
        required: false
    },
    supplierLeadTimeInDays: {
        type: Number,
        required: false
    }
};
