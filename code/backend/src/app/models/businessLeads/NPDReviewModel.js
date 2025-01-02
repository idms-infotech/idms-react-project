const mongoose = require("mongoose");
const Audit = require("../../controllers/v1/settings/audit/audit");
const {NPD_REVIEW: SCHEMA_CONST} = require("../../mocks/schemasConstant/businessLeadsConstant");
const {getAndSetAutoIncrementNo} = require("../../controllers/v1/settings/autoIncrement/autoIncrement");
const {paginatePlugin} = require("../plugins/paginatePlugin");
const {OPTIONS} = require("../../helpers/global.options");
const NPDReviewSchema = new mongoose.Schema(
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
        NPDReviewNo: {
            type: String,
            required: false
        },
        NPD: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "NPD"
        },
        NPDNo: {
            type: String,
            required: false
        },
        NPDDate: {
            type: Date,
            required: false,
            default: new Date()
        },
        name: {
            type: String,
            required: false
        },
        productCategory: {
            type: String,
            required: false
        },
        projectName: {
            type: String,
            required: false
        },
        expectedDeliveryDate: {
            type: Date,
            required: false,
            default: new Date()
        },
        customerInputs: [
            {
                reviewNo: {
                    type: String,
                    required: false
                },
                reviewDate: {
                    type: Date,
                    required: false,
                    default: new Date()
                },
                reviewBy: {
                    type: String,
                    required: false
                },
                status: {
                    type: String,
                    required: false
                },
                feasibilityDoneBy: {
                    type: String,
                    required: false
                },
                technicalReview: [
                    {
                        technicalQuestionnaire: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: false,
                            ref: "TechnicalQuestionnaire"
                        },
                        orderNo: {
                            type: Number,
                            set: value => {
                                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                                    return parseFloat(value).toFixed(2);
                                }
                            },
                            required: false
                        },
                        questionnaire: {
                            type: String,
                            required: false
                        },
                        isChecked: {
                            type: Boolean,
                            required: false,
                            default: false
                        },
                        remarks: {
                            type: String,
                            required: false
                        }
                    }
                ]
            }
        ],
        technicalReview: [
            {
                reviewNo: {
                    type: String,
                    required: false
                },
                reviewDate: {
                    type: Date,
                    required: false,
                    default: new Date()
                },
                reviewBy: {
                    type: String,
                    required: false
                },
                status: {
                    type: String,
                    required: false
                },
                feasibilityDoneBy: {
                    type: String,
                    required: false
                },
                technicalReview: [
                    {
                        technicalQuestionnaire: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: false,
                            ref: "TechnicalQuestionnaire"
                        },
                        orderNo: {
                            type: Number,
                            set: value => {
                                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                                    return parseFloat(value).toFixed(2);
                                }
                            },
                            required: false
                        },
                        questionnaire: {
                            type: String,
                            required: false
                        },
                        isChecked: {
                            type: Boolean,
                            required: false,
                            default: false
                        },
                        remarks: {
                            type: String,
                            required: false
                        }
                    }
                ]
            }
        ],
        economicReview: [
            {
                reviewNo: {
                    type: String,
                    required: false
                },
                reviewDate: {
                    type: Date,
                    required: false,
                    default: new Date()
                },
                reviewBy: {
                    type: String,
                    required: false
                },
                status: {
                    type: String,
                    required: false
                },
                feasibilityDoneBy: {
                    type: String,
                    required: false
                },
                technicalReview: [
                    {
                        technicalQuestionnaire: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: false,
                            ref: "TechnicalQuestionnaire"
                        },
                        orderNo: {
                            type: Number,
                            set: value => {
                                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                                    return parseFloat(value).toFixed(2);
                                }
                            },
                            required: false
                        },
                        questionnaire: {
                            type: String,
                            required: false
                        },
                        isChecked: {
                            type: Boolean,
                            required: false,
                            default: false
                        },
                        remarks: {
                            type: String,
                            required: false
                        }
                    }
                ]
            }
        ],
        legalReview: [
            {
                reviewNo: {
                    type: String,
                    required: false
                },
                reviewDate: {
                    type: Date,
                    required: false,
                    default: new Date()
                },
                reviewBy: {
                    type: String,
                    required: false
                },
                status: {
                    type: String,
                    required: false
                },
                feasibilityDoneBy: {
                    type: String,
                    required: false
                },
                technicalReview: [
                    {
                        technicalQuestionnaire: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: false,
                            ref: "TechnicalQuestionnaire"
                        },
                        orderNo: {
                            type: Number,
                            set: value => {
                                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                                    return parseFloat(value).toFixed(2);
                                }
                            },
                            required: false
                        },
                        questionnaire: {
                            type: String,
                            required: false
                        },
                        isChecked: {
                            type: Boolean,
                            required: false,
                            default: false
                        },
                        remarks: {
                            type: String,
                            required: false
                        }
                    }
                ]
            }
        ],
        operationalReview: [
            {
                reviewNo: {
                    type: String,
                    required: false
                },
                reviewDate: {
                    type: Date,
                    required: false,
                    default: new Date()
                },
                reviewBy: {
                    type: String,
                    required: false
                },
                status: {
                    type: String,
                    required: false
                },
                feasibilityDoneBy: {
                    type: String,
                    required: false
                },
                technicalReview: [
                    {
                        technicalQuestionnaire: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: false,
                            ref: "TechnicalQuestionnaire"
                        },
                        orderNo: {
                            type: Number,
                            set: value => {
                                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                                    return parseFloat(value).toFixed(2);
                                }
                            },
                            required: false
                        },
                        questionnaire: {
                            type: String,
                            required: false
                        },
                        isChecked: {
                            type: Boolean,
                            required: false,
                            default: false
                        },
                        remarks: {
                            type: String,
                            required: false
                        }
                    }
                ]
            }
        ],
        schedulingReview: [
            {
                reviewNo: {
                    type: String,
                    required: false
                },
                reviewDate: {
                    type: Date,
                    required: false,
                    default: new Date()
                },
                reviewBy: {
                    type: String,
                    required: false
                },
                status: {
                    type: String,
                    required: false
                },
                feasibilityDoneBy: {
                    type: String,
                    required: false
                },
                technicalReview: [
                    {
                        technicalQuestionnaire: {
                            type: mongoose.Schema.Types.ObjectId,
                            required: false,
                            ref: "TechnicalQuestionnaire"
                        },
                        orderNo: {
                            type: Number,
                            set: value => {
                                if (![undefined, null, "NaN"].includes(value) && typeof +value == "number") {
                                    return parseFloat(value).toFixed(2);
                                }
                            },
                            required: false
                        },
                        questionnaire: {
                            type: String,
                            required: false
                        },
                        isChecked: {
                            type: Boolean,
                            required: false,
                            default: false
                        },
                        remarks: {
                            type: String,
                            required: false
                        }
                    }
                ]
            }
        ],
        variants: [
            {
                variant: {
                    type: Number,
                    required: false
                },
                variantName: {
                    type: String,
                    required: false
                },
                partNo: {
                    type: String,
                    required: false
                },
                drawingNo: {
                    type: String,
                    required: false
                },
                NPDVariants: {
                    type: String,
                    required: false
                },
                status: {
                    type: String,
                    required: false,
                    default: OPTIONS.defaultStatus.OPENED
                }
            }
        ],
        status: {
            type: String,
            required: false
        },
        isReportGenerated: {
            type: Boolean,
            required: false,
            default: false
        },
        reasonToConvert: {
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
NPDReviewSchema.pre("save", async function (next) {
    const {isNew, isModified} = this;
    if (this.isNew) {
        this.NPDReviewNo = await getAndSetAutoIncrementNo({...SCHEMA_CONST.AUTO_INCREMENT_DATA()}, this.company, true);
    }
    await auditTrail(this, this.modifiedPaths(), isNew, isModified);
    next();
});
NPDReviewSchema.index({status: -1});
NPDReviewSchema.index({isReportGenerated: -1});
NPDReviewSchema.plugin(paginatePlugin);
const NPDReview = mongoose.model(SCHEMA_CONST.COLLECTION_NAME, NPDReviewSchema);

module.exports = NPDReview;
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
