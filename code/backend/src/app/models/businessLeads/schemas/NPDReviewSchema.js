const {default: mongoose} = require("mongoose");
const {OPTIONS} = require("../../../helpers/global.options");

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
};
