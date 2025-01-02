const mongoose = require("mongoose");
const {CONSTANTS} = require("../../../config/config");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {EMPLOYEE: SCHEMA_CONST} = require("../../mocks/schemasConstant/HRConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const employeeSchema = new mongoose.Schema(
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
        isLogin: {
            type: Boolean,
            required: false,
            default: false
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "User"
        },
        empCode: {
            type: String,
            required: true,
            default: "E0001"
        },
        empStatus: {
            type: String,
            required: false,
            enum: ["A", "I"],
            default: "A"
        },
        empDateOfResignation: {
            type: Date,
            required: false
        },
        reasonOfLeaving: {
            type: String,
            required: false
        },
        empFirstName: {
            type: String,
            required: true
        },
        empMiddleName: {
            type: String,
            required: false
        },
        empLastName: {
            type: String,
            required: true
        },
        empFullName: {
            type: String,
            required: false
        },
        empGender: {
            type: String,
            required: false
        },
        empDOB: {
            type: Date,
            required: false
        },
        empContactNo: {
            type: String,
            required: false
        },
        empAadharNo: {
            type: String,
            required: false
        },
        empPANNo: {
            type: String,
            required: false
        },
        empMartialStatus: {
            type: String,
            required: false
        },
        qualification: {
            type: String,
            required: false
        },
        empPFNo: {
            type: String,
            required: false
        },
        empESICNo: {
            type: String,
            required: false
        },
        empEmailCompany: {
            type: String,
            required: false
        },
        empEmailPersonal1: {
            type: String,
            required: false
        },
        empEmailPersonal2: {
            type: String,
            required: false
        },
        empFatherFullName: {
            type: String,
            required: false
        },
        empFatherDOB: {
            type: Date,
            required: false
        },
        empFatherOccupation: {
            type: String,
            required: false
        },
        empMotherFullName: {
            type: String,
            required: false
        },
        empMotherDOB: {
            type: Date,
            required: false
        },
        empMotherOccupation: {
            type: String,
            required: false
        },
        empSpouseFullName: {
            type: String,
            required: false
        },
        empSpouseDOB: {
            type: Date,
            required: false
        },
        empSpouseOccupation: {
            type: String,
            required: false
        },
        noOfDependentChildren: {
            type: String,
            required: false
        },
        fullNameOfDependentChild1: {
            type: String,
            required: false
        },
        fullNameOfDependentChild2: {
            type: String,
            required: false
        },
        empPermanentAddress: [
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
                // district: {
                //   type: String,
                //   required: false,
                // },
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
        empPresentAddress: [
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
                // district: {
                //   type: String,
                //   required: false,
                // },
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
        empJoiningDate: {
            type: Date,
            required: false
        },
        empJoiningLocation: {
            type: String,
            required: false
        },
        empGrade: {
            type: String,
            required: false
        },
        empDesignation: {
            type: String,
            required: false
        },
        empDepartment: {
            type: String,
            required: false
        },
        uploadOfferLetter: {
            type: String,
            required: false
        },
        uploadAppointmentLetter: {
            type: String,
            required: false
        },
        empReportTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: false
        },
        empOTApplicability: {
            type: String,
            required: false
        },
        empType: {
            type: String,
            required: false
        },
        empCadre: {
            type: String,
            required: false
        },
        empBefName: {
            type: String,
            required: false
        },
        empBankName: {
            type: String,
            required: false
        },
        empBankBranch: {
            type: String,
            required: false
        },
        empAccType: {
            type: String,
            required: false
        },
        empAccountNumber: {
            type: String,
            required: false
        },
        empBankIFSCCode: {
            type: String,
            required: false
        },
        empPhoto: {
            type: String,
            required: false
        },
        empResume: {
            type: String,
            required: false
        },
        empAadharCard: {
            type: String,
            required: false
        },
        empPanCard: {
            type: String,
            required: false
        },
        empExpCertificate: {
            type: String,
            required: false
        },
        empRelievingLetter: {
            type: String,
            required: false
        },
        uploadBankPassBook: {
            type: String,
            required: false
        },
        uploadBankCheckBook: {
            type: String,
            required: false
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: SCHEMA_CONST.COLLECTION_NAME
    }
);
employeeSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    this.empFullName = `${this.empFirstName} ${this.empLastName}`;
    if (this.isNew) {
        this.empCode = await getAndSetAutoIncrementNo(SCHEMA_CONST.AUTO_INCREMENT_DATA(), this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});

employeeSchema.virtual("empPhotoUrl").get(function () {
    if (this.empPhoto && this.empPhoto != "undefined") {
        return CONSTANTS.domainUrl + "employee/" + this.empPhoto;
    }
});

employeeSchema.virtual("empResumeUrl").get(function () {
    if (this.empResume && this.empResume != "undefined") {
        return CONSTANTS.domainUrl + "employee/" + this.empResume;
    }
});
employeeSchema.virtual("empAadharCardUrl").get(function () {
    if (this.empAadharCard && this.empAadharCard != "undefined") {
        return CONSTANTS.domainUrl + "employee/" + this.empAadharCard;
    }
});
employeeSchema.virtual("empPanCardUrl").get(function () {
    if (this.empPanCard && this.empPanCard != "undefined") {
        return CONSTANTS.domainUrl + "employee/" + this.empPanCard;
    }
});
employeeSchema.virtual("empExpCertificateUrl").get(function () {
    if (this.empExpCertificate && this.empExpCertificate != "undefined") {
        return CONSTANTS.domainUrl + "employee/" + this.empExpCertificate;
    }
});
employeeSchema.virtual("empRelievingLetterUrl").get(function () {
    if (this.empRelievingLetter && this.empRelievingLetter != "undefined") {
        return CONSTANTS.domainUrl + "employee/" + this.empRelievingLetter;
    }
});
employeeSchema.virtual("uploadBankPassBookUrl").get(function () {
    if (this.uploadBankPassBook && this.uploadBankPassBook != "undefined") {
        return CONSTANTS.domainUrl + "employee/" + this.uploadBankPassBook;
    }
});
employeeSchema.virtual("uploadBankCheckBookUrl").get(function () {
    if (this.uploadBankCheckBook && this.uploadBankCheckBook != "undefined") {
        return CONSTANTS.domainUrl + "employee/" + this.uploadBankCheckBook;
    }
});
employeeSchema.virtual("uploadOfferLetterUrl").get(function () {
    if (this.uploadOfferLetter && this.uploadOfferLetter != "undefined") {
        return CONSTANTS.domainUrl + "employee/" + this.uploadOfferLetter;
    }
});
employeeSchema.virtual("uploadAppointmentLetterUrl").get(function () {
    if (this.uploadAppointmentLetter && this.uploadAppointmentLetter != "undefined") {
        return CONSTANTS.domainUrl + "employee/" + this.uploadAppointmentLetter;
    }
});
// Ensure virtual fields are serialized.
employeeSchema.set("toJSON", {virtuals: true});
employeeSchema.plugin(paginatePlugin);
const Employee = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, employeeSchema);

module.exports = Employee;
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
