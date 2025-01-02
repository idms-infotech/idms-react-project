const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {B2B_CUSTOMER: SCHEMA_CONST} = require("../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {
    getAllCustomerCategory,
    setCustomerNextAutoIncrementNo
} = require("../../controllers/v1/settings/customerCategory/customerCategory");
const {getIncrementNumWithPrefix} = require("../../helpers/utility");
const customerSchema = new mongoose.Schema(
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
        customerCode: {
            type: String,
            required: false
        },
        customerNameLegalEntity: {
            type: String,
            required: false
        },
        plantName: {
            type: String,
            required: false
        },
        plantCode: {
            type: String,
            required: false
        },
        customerName: {
            type: String,
            required: true
        },
        customerNickName: {
            type: String,
            required: false
        },
        customerCategory: {
            type: String,
            required: false
            // enum:["exports","domestic"]
        },
        categoryType: {
            type: String,
            required: false
        },
        // customerType: {
        //     type: String,
        //     required: false
        //     //OEM,DEALER
        // },
        region: {
            type: String,
            required: false
        },
        transporterGSTIN: {
            type: String,
            required: false
        },
        transporterId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Transporter"
        },
        customerUdyogAadhar: {
            type: String,
            required: false
        },
        customerPAN: {
            type: String,
            required: false
        },
        GSTIN: {
            type: String,
            required: false
        },
        GSTClassification: {
            type: String,
            required: false
        },

        // MSMEClassification: {
        //     type: String,
        //     required: false,
        // },
        // customerMSMENo: {
        //     type: String,
        //     required: false,
        // },

        // customerURD: {
        //     type: String,
        //     required: false,
        // },

        // customerVendorCode: {
        //     type: String,
        //     required: false,
        // },
        customerBillingAddress: [
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
        customerShippingAddress: [
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
                },
                GSTIN: {
                    type: String,
                    required: false,
                    trim: true
                }
            }
        ],
        customerContactInfo: [
            {
                contactPersonName: {
                    type: String,
                    required: false
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
                    required: false
                },
                contactPersonEmail: {
                    type: String,
                    required: false
                }
            }
        ],
        frightCharge: {
            type: String,
            required: false
        },
        transporter: {
            type: String,
            required: false
        },
        destination: {
            type: String,
            required: false
        },
        customerCurrency: {
            type: String,
            required: false,
            default: "INR"
        },
        creditLimit: {
            type: String,
            required: false
        },
        customerPaymentTerms: {
            type: String,
            required: false
        },
        freightTerms: {
            type: String,
            required: false
        },
        isCustomerActive: {
            type: String,
            required: false,
            enum: ["A", "I"],
            default: "A"
        },
        customerWebsite: {
            type: String,
            required: false
        },
        printQRCodeOnInvoice: {
            type: String,
            required: false
        },
        printDSOnInvoice: {
            type: String,
            required: false
        },
        venderCode: {
            type: String,
            required: false
        },
        showPANNo: {
            type: String,
            required: false
        },
        showEximCode: {
            type: String,
            required: false,
            enum: ["Yes", "No"],
            default: "No"
        },
        showSKUDescription: {
            type: String,
            required: false,
            enum: ["Yes", "No"],
            default: "Yes"
        },
        TCSOnScrap: {
            type: String,
            required: false,
            enum: ["Yes", "No"],
            default: "No"
        },
        TCSOnVendor: {
            type: String,
            required: false,
            enum: ["Yes", "No"],
            default: "No"
        },
        eximCode: {
            type: String,
            required: false
        },
        customerBankDetails: [
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
        // customerAlsoSupplier: {
        //     type: Boolean,
        //     required: false,
        // },

        // customerLeadTimeInDays: {
        //     type: String,
        //     required: false,
        // },
        // cpaFile: {
        //     type: String,
        //     required: false,
        // },
    },
    {
        collection: SCHEMA_CONST.COLLECTION_NAME,
        timestamps: true
    }
);

customerSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        const categoryList = await getAllCustomerCategory(this.company);
        if (categoryList?.length) {
            let category = categoryList.find(x => this.customerCategory == x.category);
            if (!!category) {
                this.customerCode = getIncrementNumWithPrefix({
                    modulePrefix: category.prefix,
                    autoIncrementValue: category.nextAutoIncrement,
                    digit: category.digit
                });
                await setCustomerNextAutoIncrementNo(this.customerCategory);
            }
        } else {
            this.customerCode = await getAndSetAutoIncrementNo(
                {...SCHEMA_CONST.AUTO_INCREMENT_DATA()},
                this.company,
                true
            );
        }
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
customerSchema.index({isCustomerActive: -1});
customerSchema.plugin(paginatePlugin);
const Customer = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, customerSchema);
module.exports = Customer;
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
