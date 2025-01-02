const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/businessLeads/NPDReviewModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {getAllTechnicalQuestionnaire} = require("../technicalQuestionnaire/technicalQuestionnaire");
const {updateNPDStatus} = require("../NPDRequest/NPDRequest");
const {getAllProspectsForNPD} = require("../prospect/prospect");
const {getAllCustomersForNPD} = require("../../sales/customerMaster/customerMaster");
const {getEndDateTime, getStartDateTime, dateToAnyFormat} = require("../../../../helpers/dateTime");
const ObjectId = mongoose.Types.ObjectId;
const NPDReviewHelper = require("../../../../models/businessLeads/helpers/NPDReviewHelper");
// const {getNPDReviewMailConfig} = require("./NPDReviewMail");
const {NPD_REVIEW_FIELDS, NPD_REVIEW_MAIL_ACTION} = require("../../../../mocks/constantData");
const NPDReviewRepository = require("../../../../models/businessLeads/repository/NPDReviewRepository");
const {filteredNPDList} = require("../../../../models/businessLeads/repository/NPDRepository");
const {NPD_REVIEW} = require("../../../../mocks/schemasConstant/businessLeadsConstant");
const {BUSINESS_LEAD_MAIL_CONST} = require("../../../../mocks/mailTriggerConstants");
const MailTriggerRepository = require("../../../../models/settings/repository/mailTriggerRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = NPDReviewHelper.getAllNPDReviewAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company)
                }
            },
            {
                $match: {
                    isReportGenerated: {$ne: true}
                }
            }
        ];
        let rows = await NPDReviewRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.create = asyncHandler(async (req, res) => {
    try {
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const saveObj = new Model(createdObj);
        const itemDetails = await saveObj.save();
        if (itemDetails) {
            await updateNPDStatus(itemDetails.NPD);
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("NPD")
            });
            // let mailCreateObj = {
            //     id: itemDetails._id,
            //     reviewField: "customerInputs",
            //     company: req.user.company,
            //     mailAction: "Customer Inputs"
            // };
            // getNPDReviewMailConfig(mailCreateObj);
            let mailTriggerCreateObj = {
                subModuleId: itemDetails._id,
                action: "customerInputs",
                company: req.user.company,
                mailAction: "Customer Inputs",
                collectionName: NPD_REVIEW.COLLECTION_NAME,
                message: `NPD No. ${itemDetails.NPDNo} Customer Inputs Review started for ${itemDetails.name}`,
                module: BUSINESS_LEAD_MAIL_CONST.NPD_REVIEW.MODULE,
                subModule: BUSINESS_LEAD_MAIL_CONST.NPD_REVIEW.SUB_MODULE,
                isSent: false
            };
            await MailTriggerRepository.createDoc(mailTriggerCreateObj);
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create NPD Review", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await Model.findById(req.params.id).populate("NPD", "noOfVariants variantsInfo");
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        if (req.body.isReportGenerated && itemDetails.status == "Feasible") {
            if (itemDetails.NPD.variantsInfo.length == 0) {
                itemDetails.variants = {
                    variant: 1,
                    variantName: "",
                    partNo: "",
                    drawingNo: "",
                    NPDVariants: `${itemDetails.NPDNo}/${String(1).padStart(2, "0")}`,
                    status: OPTIONS.defaultStatus.OPENED
                };
            } else {
                let variantsInfo = JSON.parse(JSON.stringify(itemDetails.NPD.variantsInfo));
                itemDetails.variants = variantsInfo.map(x => {
                    x.NPDVariants = `${itemDetails.NPDNo}/${String(x.variant).padStart(2, "0")}`;
                    x.status = OPTIONS.defaultStatus.OPENED;
                    return x;
                });
            }
        }
        itemDetails = await generateCreateData(itemDetails, req.body);
        const reviewFields = NPD_REVIEW_FIELDS;
        let statusArray = [];
        for (const field of reviewFields) {
            if (itemDetails && itemDetails[field].length > 0) {
                statusArray.push(itemDetails[field].slice(-1)[0].status);
            }
        }
        itemDetails.status = "Feasible";
        if (statusArray.includes("Not Feasible")) {
            itemDetails.status = "Not Feasible";
        } else if (statusArray.includes("Additional Review Required")) {
            itemDetails.status = "Additional Review Required";
        }
        itemDetails = await itemDetails.save();
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.UPDATE("NPD has been")
            });
            let keys = Object.keys(req.body);
            const intersection = reviewFields.find(element => keys.includes(element));
            if (intersection) {
                // let mailUpdateObj = {
                //     id: itemDetails._id,
                //     reviewField: intersection,
                //     company: req.user.company,
                //     mailAction: NPD_REVIEW_MAIL_ACTION[intersection]
                // };
                // getNPDReviewMailConfig(mailUpdateObj);
                let mailTriggerCreateObj = {
                    subModuleId: itemDetails._id,
                    action: intersection,
                    company: req.user.company,
                    mailAction: NPD_REVIEW_MAIL_ACTION[intersection],
                    collectionName: NPD_REVIEW.COLLECTION_NAME,
                    message: `NPD No. ${itemDetails.NPDNo} ${NPD_REVIEW_MAIL_ACTION[intersection]} started for ${itemDetails.name}`,
                    module: BUSINESS_LEAD_MAIL_CONST.NPD_REVIEW.MODULE,
                    subModule: BUSINESS_LEAD_MAIL_CONST.NPD_REVIEW.SUB_MODULE,
                    isSent: false
                };
                await MailTriggerRepository.createDoc(mailTriggerCreateObj);
            }
        }
    } catch (e) {
        console.error("update NPD Review", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id).populate("NPD", "NPDNo");
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("NPD Review");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById NPD Review", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("NPD Review")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("NPD Review");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById NPD Review", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const technicalQuestionnaire = await getAllTechnicalQuestionnaire(req.user.company);
        const NPDOptions = await filteredNPDList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.AWAITING_REVIEW,
                    referenceModel: {$exists: true}
                }
            },
            {$sort: {NPDNo: 1}},

            {
                $lookup: {
                    from: "Customer",
                    let: {fieldId: "$reference"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$fieldId"]
                                }
                            }
                        },
                        {$project: {customerName: 1}}
                    ],
                    as: "customers"
                }
            },
            {
                $unwind: {
                    path: "$customers",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "Prospect",
                    let: {fieldId: "$reference"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$fieldId"]
                                }
                            }
                        },
                        {$project: {prospectName: 1}}
                    ],
                    as: "prospects"
                }
            },
            {
                $unwind: {
                    path: "$prospects",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $project: {
                    name: {
                        $cond: [
                            {$eq: ["$referenceModel", "Prospect"]},
                            "$prospects.prospectName",
                            "$customers.customerName"
                        ]
                    },
                    NPDNo: 1,
                    NPDDate: 1,
                    projectName: 1,
                    productCategory: 1
                }
            }
        ]);
        return res.success({
            technicalQuestionnaire,
            NPDOptions
        });
    } catch (error) {
        console.error("getAllMasterData NPD Review", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.updateNPDStatus = asyncHandler(async NPDId => {
    try {
        let rows = await Model.findOneAndUpdate(
            {
                _id: ObjectId(NPDId)
            },
            {status: OPTIONS.defaultStatus.REVIEW_STARTED}
        );
        return rows;
    } catch (e) {
        console.error("updateNPDStatus", e);
    }
});

exports.getAllNPDFinalStatusReport = asyncHandler(async (req, res) => {
    try {
        const prospects = await getAllProspectsForNPD(req.user.company);
        const customers = await getAllCustomersForNPD(req.user.company);
        for (let i = 0; i < prospects.length; i++) {
            const ele = prospects[i];
            customers.push(ele);
        }
        const {referenceName = null, toDate = null, fromDate = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            $or: [
                {status: "Not Feasible"},
                {$and: [{reasonToConvert: {$ne: null}}, {reasonToConvert: {$exists: true}}]}
            ],
            isReportGenerated: true,
            ...(!!referenceName && {
                name: referenceName
            }),
            ...(!!toDate &&
                !!fromDate && {
                    NPDDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = NPDReviewHelper.getAllNPDFinalStatusReportAttributes();
        let pipeline = [
            {
                $match: query
            }
        ];
        let rows = await NPDReviewRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            prospects,
            customers,
            ...rows
        });
    } catch (e) {
        console.error("getAllNPDFinalStatusReport", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllNPDReviewForVariants = async company => {
    try {
        let rows = await Model.aggregate([
            {$unwind: "$variants"},
            {
                $match: {
                    company: ObjectId(company),
                    isReportGenerated: {$eq: true},
                    "variants.status": OPTIONS.defaultStatus.OPENED
                }
            },
            {
                $lookup: {
                    from: "NPD",
                    localField: "NPD",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, reference: 1, referenceModel: 1, monthlyOffTakeQty: 1}}],
                    as: "NPD"
                }
            },
            {$unwind: "$NPD"},
            {
                $lookup: {
                    from: "Customer",
                    let: {fieldId: "$NPD.reference"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$fieldId"]
                                }
                            }
                        },
                        {$project: {customerName: 1, customerCurrency: 1}}
                    ],
                    as: "NPD.customers"
                }
            },
            {
                $unwind: {
                    path: "$NPD.customers",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "Prospect",
                    let: {fieldId: "$NPD.reference"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$fieldId"]
                                }
                            }
                        },
                        {$project: {_id: 1, prospectName: 1, customerCurrency: "$currency"}}
                    ],
                    as: "NPD.prospects"
                }
            },
            {
                $unwind: {
                    path: "$NPD.prospects",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    name: 1,
                    monthlyOffTakeQty: "$NPD.monthlyOffTakeQty",
                    dSKUNo: "$variants.NPDVariants",
                    customerCurrency: {
                        $cond: [
                            {$eq: ["$NPD.referenceModel", "Prospect"]},
                            "$NPD.prospects.customerCurrency",
                            "$NPD.customers.customerCurrency"
                        ]
                    },
                    projectName: 1,
                    customerPartNo: "$variants.partNo",
                    artWorkNo: "$variants.drawingNo",
                    productCategory: 1,
                    referenceModel: "$NPD.referenceModel",
                    reference: {
                        $cond: [{$eq: ["$NPD.referenceModel", "Prospect"]}, "$NPD.prospects._id", "$NPD.customers._id"]
                    }
                }
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllNPDReviewForVariants", e);
    }
};

exports.updateNPDReviewOnDesignSKUCreate = async (company, NPDReviewId, variantNo) => {
    try {
        let rows = await Model.findOneAndUpdate(
            {
                _id: NPDReviewId,
                company: company
            },
            {
                $set: {
                    "variants.$[v].status": OPTIONS.defaultStatus.CLOSED
                }
            },
            {new: true, arrayFilters: [{"v.NPDVariants": variantNo}]}
        );
    } catch (e) {
        console.error("updateNPDReviewOnDesignSKUCreate", e);
    }
};
exports.getAllNPDStatusReport = asyncHandler(async (req, res) => {
    try {
        const prospects = await getAllProspectsForNPD(req.user.company);
        const customers = await getAllCustomersForNPD(req.user.company);
        for (let i = 0; i < prospects.length; i++) {
            const ele = prospects[i];
            customers.push(ele);
        }
        const {referenceName = null, toDate = null, fromDate = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            isReportGenerated: true,
            ...(!!referenceName && {
                name: referenceName
            }),
            $or: [{reasonToConvert: {$eq: null}}, {reasonToConvert: {$exists: false}}],
            status: {$ne: "Not Feasible"},
            ...(!!toDate &&
                !!fromDate && {
                    NPDDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = NPDReviewHelper.getAllNPDStatusReportAttributes();
        let pipeline = [
            {
                $match: query
            }
        ];
        let output = await NPDReviewRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        const reviewFields = [
            "customerInputs",
            "technicalReview",
            "economicReview",
            "legalReview",
            "operationalReview",
            "schedulingReview"
        ];
        for (const ele of output.rows) {
            const statusArray = reviewFields.map(field => ele[field]?.slice(-1)[0]?.status).filter(status => status);
            ele.status = statusArray.includes("Not Feasible")
                ? "Not Feasible"
                : statusArray.includes("Additional Review Required")
                ? "Additional Review Required"
                : "Feasible";

            if (!!ele.variants && ele.variants.every(x => x.status == OPTIONS.defaultStatus.CLOSED)) {
                ele.status = OPTIONS.defaultStatus.CLOSED;
            } else {
                ele.status = "Partial D-SKU";
            }
        }
        return res.success({
            prospects,
            customers,
            ...output
        });
    } catch (e) {
        console.error("getAllNPDStatusReport", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getTotalNoOfNPDLostPerDay = async company => {
    const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
    const rows = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$NPDDate"}}
            }
        },
        {
            $match: {
                company: ObjectId(company),
                matchDate: currentDate
            }
        },
        {
            $group: {
                _id: null,
                count: {$sum: {$cond: [{$eq: ["$status", "Not Feasible"]}, 1, 0]}}
            }
        },
        {
            $project: {
                _id: 0,
                count: 1
            }
        }
    ]);
    return rows[0]?.count || 0;
};
