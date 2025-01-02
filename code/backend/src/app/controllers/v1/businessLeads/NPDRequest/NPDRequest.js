const Model = require("../../../../models/businessLeads/NPDModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {removeFilesInError, removeFile} = require("../../../../helpers/utility");
const {OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {
    getFirstDateOfMonth,
    getLastDateOfMonth,
    getFirstDayOfFiscalYear,
    getLastDayOfFiscalYear,
    getFirstDateOfCurrentFiscalYear,
    getLastDateOfCurrentFiscalYear,
    getFiscalMonthsName
} = require("../../../../utilities/utility");
const {getAllNPDAttributes, getAllNPDExcelAttributes} = require("../../../../models/businessLeads/helpers/NPDHelper");
const {dateToAnyFormat} = require("../../../../helpers/dateTime");
// const {getNPDMailConfig} = require("./NPDRequestMail");
const {getAllSKUCategory} = require("../../settings/SKUCategoryMaster/SKUCategoryMaster");
const {NPD_REQUEST} = require("../../../../mocks/schemasConstant/businessLeadsConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {
    filteredChecklistParticularsList
} = require("../../../../models/businessLeads/repository/checklistParticularsRepository");
const NPDRequestRepository = require("../../../../models/businessLeads/repository/NPDRepository");
const {filteredProductCategoryMasterList} = require("../../../../models/settings/repository/productCategoryRepository");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const {filteredProspectList} = require("../../../../models/businessLeads/repository/prospectMasterRepository");
const MailTriggerRepository = require("../../../../models/settings/repository/mailTriggerRepository");
const {BUSINESS_LEAD_MAIL_CONST} = require("../../../../mocks/mailTriggerConstants");
const { getAllModuleMaster } = require("../../settings/module-master/module-master");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = async (req, res) => {
    try {
        let project = getAllNPDAttributes();
        if (req.query.excel == "true") {
            project = getAllNPDExcelAttributes();
        }
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    referenceModel: {$exists: true},
                    status: {$nin: OPTIONS.defaultStatus.getAllFilterStatusArray(["REVIEW_STARTED", "CLOSED"])}
                }
            },
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
            }
        ];
        let rows = await NPDRequestRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.create = async (req, res) => {
    try {
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        if (createdObj.customerInputsChecklist) {
            createdObj.customerInputsChecklist = JSON.parse(createdObj.customerInputsChecklist);
        }
        if (createdObj.variantsInfo) {
            createdObj.variantsInfo = JSON.parse(createdObj.variantsInfo);
        }
        if (req.files) {
            if (req.files.engineeringDrawing && req.files.engineeringDrawing.length > 0) {
                createdObj["engineeringDrawing"] = req.files.engineeringDrawing[0].filename;
            }
            if (req.files.productSpecification && req.files.productSpecification.length > 0) {
                createdObj["productSpecification"] = req.files.productSpecification[0].filename;
            }
            if (req.files.designMockUpFile && req.files.designMockUpFile.length > 0) {
                createdObj["designMockUpFile"] = req.files.designMockUpFile[0].filename;
            }
            if (req.files.artworkForProcessingFile && req.files.artworkForProcessingFile.length > 0) {
                createdObj["artworkForProcessingFile"] = req.files.artworkForProcessingFile[0].filename;
            }
        }
        const itemDetails = await NPDRequestRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("NPD Request")
            });
            // let mailCreateObj = {
            //     id: itemDetails._id,
            //     action: "generated",
            //     company: req.user.company,
            //     mailAction: "Create"
            // };
            // getNPDMailConfig(mailCreateObj);
            let mailTriggerCreateObj = {
                subModuleId: itemDetails._id,
                action: "generated",
                company: req.user.company,
                mailAction: "Create",
                collectionName: NPD_REQUEST.COLLECTION_NAME,
                message: `NPD No. ${itemDetails.NPDNo} Generated for ${itemDetails.name}`,
                module: BUSINESS_LEAD_MAIL_CONST.NPD_REQUEST.MODULE,
                subModule: BUSINESS_LEAD_MAIL_CONST.NPD_REQUEST.SUB_MODULE,
                isSent: false
            };
            await MailTriggerRepository.createDoc(mailTriggerCreateObj);
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create NPD Request", e);
        if (req.files) {
            removeFilesInError(req.files.engineeringDrawing);
            removeFilesInError(req.files.productSpecification);
            removeFilesInError(req.files.designMockUpFile);
            removeFilesInError(req.files.artworkForProcessingFile);
        }
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.update = async (req, res) => {
    try {
        let itemDetails = await NPDRequestRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        if (req.body.customerInputsChecklist) {
            req.body.customerInputsChecklist = JSON.parse(req.body.customerInputsChecklist);
        }
        if (req.body.variantsInfo) {
            req.body.variantsInfo = JSON.parse(req.body.variantsInfo);
        }
        itemDetails.updatedBy = req.user.sub;
        if (req.files) {
            if (req.files["engineeringDrawing"] && req.files["engineeringDrawing"].length > 0) {
                if (itemDetails.engineeringDrawing) {
                    removeFile(`${req.files.engineeringDrawing[0].destination}/${itemDetails.engineeringDrawing}`);
                }
                itemDetails["engineeringDrawing"] = req.files["engineeringDrawing"][0].filename;
            }
            if (req.files["productSpecification"] && req.files["productSpecification"].length > 0) {
                if (itemDetails.productSpecification) {
                    console.log(
                        "${req.files.productSpecification[0].destination}/${itemDetails.productSpecification}",
                        `${req.files.productSpecification[0].destination}/${itemDetails.productSpecification}`
                    );
                    removeFile(`${req.files.productSpecification[0].destination}/${itemDetails.productSpecification}`);
                }
                itemDetails["productSpecification"] = req.files["productSpecification"][0].filename;
            }
            if (req.files["designMockUpFile"] && req.files["designMockUpFile"].length > 0) {
                if (itemDetails.designMockUpFile) {
                    removeFile(`${req.files.designMockUpFile[0].destination}/${itemDetails.designMockUpFile}`);
                }
                itemDetails["designMockUpFile"] = req.files["designMockUpFile"][0].filename;
            }
            if (req.files["artworkForProcessingFile"] && req.files["artworkForProcessingFile"].length > 0) {
                if (itemDetails.artworkForProcessingFile) {
                    removeFile(
                        `${req.files.artworkForProcessingFile[0].destination}/${itemDetails.artworkForProcessingFile}`
                    );
                }
                itemDetails["artworkForProcessingFile"] = req.files["artworkForProcessingFile"][0].filename;
            }
        }
        itemDetails = await NPDRequestRepository.updateDoc(itemDetails, req.body);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.UPDATE("NPD Request has been")
            });
            // let mailUpdateObj = {
            //     id: itemDetails._id,
            //     action: "edited",
            //     company: req.user.company,
            //     mailAction: "Update"
            // };
            // getNPDMailConfig(mailUpdateObj);
            let mailTriggerCreateObj = {
                subModuleId: itemDetails._id,
                action: "edited",
                company: req.user.company,
                mailAction: "Update",
                collectionName: NPD_REQUEST.COLLECTION_NAME,
                message: `NPD No. ${itemDetails.NPDNo} edited for ${itemDetails.name}`,
                module: BUSINESS_LEAD_MAIL_CONST.NPD_REQUEST.MODULE,
                subModule: BUSINESS_LEAD_MAIL_CONST.NPD_REQUEST.SUB_MODULE,
                isSent: false
            };
            await MailTriggerRepository.createDoc(mailTriggerCreateObj);
        }
    } catch (e) {
        console.error("update NPD Request", e);
        if (req.files) {
            removeFilesInError(req.files.engineeringDrawing);
            removeFilesInError(req.files.productSpecification);
            removeFilesInError(req.files.designMockUpFile);
            removeFilesInError(req.files.artworkForProcessingFile);
        }
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getById = async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id).populate(
            "customerInputsChecklist.inputCheckListParticular",
            "name order"
        );
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("NPD Request");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById NPD Request", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.deleteById = async (req, res) => {
    try {
        const deleteItem = await NPDRequestRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("NPD Request")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("NPD Request");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById NPD Request ", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getAllMasterData = async (req, res) => {
    try {
        const checklistParticularsList = await filteredChecklistParticularsList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {$sort: {order: 1}},
            {
                $project: {
                    inputCheckListParticular: "$_id",
                    name: 1,
                    order: 1,
                    isChecked: {$literal: false},
                    _id: 0
                }
            }
        ]);
        const orderType = await getAllModuleMaster(req.user.company, "ORDER_TYPE");
        const buildStage = await getAllModuleMaster(req.user.company, "BUILD_STAGE");
        const developmentCharges = await getAllModuleMaster(req.user.company, "DEVELOPMENT_CHARGES");
        const SKUCategoryList = await getAllSKUCategory(req.user.company, null);
        let productCategories;
        if (SKUCategoryList.length > 0) {
            productCategories = SKUCategoryList.map(x => {
                return {
                    label: x.displayProductCategoryName,
                    value: x.displayProductCategoryName,
                    application: x.application,
                    productNumber: x.SKUCategoryName,
                    productCode: x.productCode
                };
            });
        } else {
            productCategories = await filteredProductCategoryMasterList([
                {
                    $match: {
                        company: ObjectId(req.user.company),
                        categoryStatus: OPTIONS.defaultStatus.ACTIVE
                    }
                },
                {$sort: {seq: 1}},
                {
                    $project: {
                        productNumber: 1,
                        productCode: 1,
                        displayProductCategoryName: 1,
                        application: 1
                    }
                }
            ]);
            productCategories = productCategories.map(x => {
                return {
                    label: x.displayProductCategoryName,
                    value: x.displayProductCategoryName,
                    application: x.application,
                    productNumber: x.productNumber,
                    productCode: x.productCode
                };
            });
        }
        const prospects = await filteredProspectList([
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE,
                    company: ObjectId(req.user.company)
                }
            },
            {$sort: {prospectName: 1}},
            {
                $project: {
                    customerCode: "$prospectRegistrationCode",
                    customerBillingState: "$correspondenceAddress.state",
                    customerBillingCity: "$correspondenceAddress.city",
                    customerBillingPinCode: "$correspondenceAddress.pinCode",
                    name: "$prospectName",
                    label: "$prospectName",
                    customerName: "$prospectName",
                    type: "Prospect",
                    currency: ""
                }
            }
        ]);
        const customers = await filteredCustomerList([
            {
                $match: {
                    isCustomerActive: "A",
                    company: ObjectId(req.user.company)
                }
            },
            {$sort: {customerName: 1}},
            {
                $addFields: {
                    customerBillingAddress: {$arrayElemAt: ["$customerBillingAddress", 0]}
                }
            },
            {
                $project: {
                    customerCode: 1,
                    customerBillingState: "$customerBillingAddress.state",
                    customerBillingCity: "$customerBillingAddress.city",
                    customerBillingPinCode: "$customerBillingAddress.pinCode",
                    name: "$customerName",
                    customerName: 1,
                    label: "$customerName",
                    type: "Customer",
                    currency: "$customerCurrency"
                }
            }
        ]);
        for (let i = 0; i < prospects.length; i++) {
            const ele = prospects[i];
            customers.push(ele);
        }
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...NPD_REQUEST.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        return res.success({
            autoIncrementNo,
            customers,
            checklistParticularsList,
            productCategory: productCategories,
            orderType,
            buildStage,
            developmentCharges,
        });
    } catch (error) {
        console.error("getAllMasterData NPD Request", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.updateNPDStatus = async NPDId => {
    try {
        let rows = await NPDRequestRepository.findAndUpdateDoc(
            {
                _id: ObjectId(NPDId)
            },
            {status: OPTIONS.defaultStatus.REVIEW_STARTED}
        );
        return rows;
    } catch (e) {
        console.error("updateNPDStatus", e);
    }
};

exports.getAllCountsOfNPD = async company => {
    try {
        const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
        const rows = await NPDRequestRepository.filteredNPDList([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$NPDDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company)
                }
            },
            {
                $facet: {
                    YTDNPD: [
                        {
                            $match: {
                                matchDate: {
                                    $gte: dateToAnyFormat(getFirstDayOfFiscalYear(), "YYYY-MM-DD"),
                                    $lte: dateToAnyFormat(getLastDayOfFiscalYear(), "YYYY-MM-DD")
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                count: {$sum: 1}
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                NPDCount: "$count"
                            }
                        }
                    ],
                    MTDNPD: [
                        {
                            $match: {
                                matchDate: {
                                    $gte: dateToAnyFormat(getFirstDateOfMonth(), "YYYY-MM-DD"),
                                    $lte: dateToAnyFormat(getLastDateOfMonth(), "YYYY-MM-DD")
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                count: {$sum: 1}
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                NPDCount: "$count"
                            }
                        }
                    ],
                    totalNoOfNPDRequestPerDay: [
                        {
                            $match: {
                                matchDate: currentDate
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                countAwaiting: {
                                    $sum: {$cond: [{$eq: ["$status", OPTIONS.defaultStatus.AWAITING_REVIEW]}, 1, 0]}
                                },
                                countClosed: {$sum: {$cond: [{$eq: ["$status", OPTIONS.defaultStatus.CLOSED]}, 1, 0]}}
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                NPDRequestCount: "$countAwaiting",
                                NPDClosedCount: "$countClosed"
                            }
                        }
                    ]
                }
            }
        ]);
        let obj = {
            YTDNPD: rows[0]?.YTDNPD[0]?.NPDCount || 0,
            MTDNPD: rows[0]?.MTDNPD[0]?.NPDCount || 0,
            totalNoOfNPDRequestPerDay: rows[0]?.totalNoOfNPDRequestPerDay[0]?.NPDRequestCount || 0,
            totalNoOfNPDClosedPerDay: rows[0]?.totalNoOfNPDRequestPerDay[0]?.NPDClosedCount || 0
        };
        return obj;
    } catch (error) {
        console.error("getAllCountsOfNPD", e);
    }
};

exports.getMonthlyNPDMaster = async company => {
    try {
        const monthsArray = getFiscalMonthsName();
        const NPDData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const result = await NPDRequestRepository.filteredNPDList([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$NPDDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $group: {
                    _id: {year_month: {$substrCP: ["$NPDDate", 0, 7]}},
                    count: {$sum: 1}
                }
            },
            {
                $sort: {"_id.year_month": 1}
            },
            {
                $project: {
                    _id: 0,
                    count: 1,
                    month_year: {
                        $concat: [
                            {
                                $arrayElemAt: [
                                    monthsArray,
                                    {
                                        $subtract: [{$toInt: {$substrCP: ["$_id.year_month", 5, 2]}}, 4]
                                    }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    data: {$push: {k: "$month_year", v: "$count"}}
                }
            },
            {
                $project: {
                    data: {$arrayToObject: "$data"},
                    _id: 0
                }
            }
        ]);
        if (result.length > 0) {
            const propertyNames = Object.keys(result[0].data);
            const propertyValues = Object.values(result[0].data);
            let n = 0;
            propertyNames.forEach(elem => {
                let index = monthsArray.indexOf(elem);
                NPDData[index] = propertyValues[n];
                n++;
            });
            let monthlyNPDVolume = {months: monthsArray, orders: NPDData};
            return monthlyNPDVolume;
        } else {
            let monthlyNPDVolume = {months: monthsArray, orders: []};
            return monthlyNPDVolume;
        }
    } catch (error) {
        console.error(error);
    }
};

exports.getStatusWiseNPDCount = async company => {
    try {
        const statusArray = OPTIONS.defaultStatus.getAllFilterStatusArray([
            "AWAITING_REVIEW",
            "REVIEW_STARTED",
            "CLOSED",
            "PUT_ON_HOLD",
            "TERMINATE"
        ]);
        const NPDStatusWiseCountData = [0, 0, 0, 0, 0];
        const result = await NPDRequestRepository.filteredNPDList([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$NPDDate"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    awaitingReview: {$sum: {$cond: [{$eq: ["$status", "Awaiting Review"]}, 1, 0]}},
                    reviewStartedCount: {$sum: {$cond: [{$eq: ["$status", "Review Started"]}, 1, 0]}},
                    closedCount: {$sum: {$cond: [{$eq: ["$status", "Closed"]}, 1, 0]}},
                    putOnHoldCount: {$sum: {$cond: [{$eq: ["$status", "Put On Hold"]}, 1, 0]}},
                    terminateCount: {$sum: {$cond: [{$eq: ["$status", "Terminate"]}, 1, 0]}}
                }
            },
            {
                $project: {
                    _id: 0,
                    awaitingReview: 1,
                    reviewStartedCount: 1,
                    closedCount: 1,
                    putOnHoldCount: 1,
                    terminateCount: 1
                }
            }
        ]);
        if (result.length > 0) {
            NPDStatusWiseCountData[0] = result[0].awaitingReview;
            NPDStatusWiseCountData[1] = result[0].reviewStartedCount;
            NPDStatusWiseCountData[2] = result[0].closedCount;
            NPDStatusWiseCountData[3] = result[0].putOnHoldCount;
            NPDStatusWiseCountData[4] = result[0].terminateCount;
        }
        return {
            status: statusArray,
            data: NPDStatusWiseCountData
        };
    } catch (error) {
        console.error(error);
    }
};
