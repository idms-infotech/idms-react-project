const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/sales/quotationDSKUModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {getAllQuotationDSKUtAttributes} = require("../../../../models/sales/helpers/quotationDSKUHelper");
const {getAllProspects} = require("../../businessLeads/prospect/prospect");
const {getAllDSKUListByCustomerOrProspectId} = require("../../businessLeads/NPDMaster/NPDMasters");
const {getAllCustomers} = require("../customerMaster/customerMaster");
const {default: mongoose} = require("mongoose");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {getQMSMappingByModuleAndTitle} = require("../../settings/report-qms-mapping/report-qms-mapping");
const {CONSTANTS} = require("../../../../../config/config");
const {QUOTATION_DSKU} = require("../../../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const QuotationDSKURepository = require("../../../../models/sales/repository/quotationDSKURepository");
const {filteredProspectList} = require("../../../../models/businessLeads/repository/prospectMasterRepository");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const {checkExportsCustomer} = require("../../../../helpers/utility");
const {getAllCustomerCategory} = require("../../settings/customerCategory/customerCategory");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllQuotationDSKUtAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: {$ne: OPTIONS.defaultStatus.REPORT_GENERATED}
                }
            }
        ];
        let rows = await QuotationDSKURepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
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
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Quotation DSKU")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Quotation DSKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await Model.findById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        if (itemDetails.revNo != req.body.revNo) {
            let historyObj = {...itemDetails.toObject()};
            delete historyObj.revHistory;
            delete historyObj.id;
            delete historyObj._id;
            itemDetails.revHistory.push(historyObj);
        }
        itemDetails = await generateCreateData(itemDetails, req.body);
        if (!!req.body.quotationDetails && req.body.quotationDetails.length) {
            itemDetails.quotationDetails = req.body.quotationDetails;
        }
        itemDetails = await itemDetails.save();
        return res.success({
            message: `Quotation DSKU has been ${
                itemDetails.status == "Created" ? "updated" : itemDetails.status.toLowerCase()
            } successfully`
        });
    } catch (e) {
        console.error("update Quotation DSKU", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("Quotation DSKU")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Quotation DSKU");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Quotation DSKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Quotation DSKU");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Quotation DSKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const modulePrefix = await findAppParameterValue("QUOTATION_DSKU_MODULE_PREFIX", req.user.company);
        const SKUModulePrefix = await findAppParameterValue("QUOTATION_SKU_MODULE_PREFIX", req.user.company);
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...QUOTATION_DSKU.AUTO_INCREMENT_DATA(), modulePrefix},
            req.user.company
        );
        let salesCategory = await getAllCustomerCategory(req.user.company);
        return res.success({
            autoIncrementNo: autoIncrementNo.replace(SKUModulePrefix, modulePrefix),
            salesCategoryOptions: salesCategory.map(x => {
                return {
                    category: x?.category,
                    categoryType: x?.categoryType
                };
            })
        });
    } catch (error) {
        console.error("getAllMasterData Quotation DSKU", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllProspectsForQuotationDSKUByCategory = asyncHandler(async (req, res) => {
    try {
        const prospectList = await filteredProspectList([
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE,
                    company: ObjectId(req.user.company)
                }
            },
            {$sort: {prospectName: 1}},
            {
                $project: {
                    customerName: "$prospectName",
                    customerCode: "$prospectRegistrationCode",
                    customerBillingState: "$correspondenceAddress.state",
                    customerBillingCity: "$correspondenceAddress.city",
                    customerBillingPinCode: "$correspondenceAddress.pinCode",
                    customerCategory: 1,
                    currency: 1,
                    reference: "$_id",
                    referenceModel: "Prospect"
                }
            }
        ]);
        const customerList = await filteredCustomerList([
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
                    customerName: 1,
                    customerBillingState: "$customerBillingAddress.state",
                    customerBillingCity: "$customerBillingAddress.city",
                    customerBillingPinCode: "$customerBillingAddress.pinCode",
                    customerCategory: 1,
                    currency: "$customerCurrency",
                    reference: "$_id",
                    referenceModel: "Customer"
                }
            }
        ]);
        for (let i = 0; i < customerList.length; i++) {
            const ele = customerList[i];
            prospectList.push(ele);
        }
        return res.success(prospectList);
    } catch (e) {
        console.error("getAllProspectsForQuotationDSKU Quotation DSKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllQuotationDSKU = async (company, project = {}) => {
    try {
        let rows = await Model.find(
            {
                company: company
            },
            project
        ).sort({quotationNo: 1});
        return rows;
    } catch (e) {
        console.error("getAllQuotationDSKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return errors;
    }
};

exports.getAllDSKUForQuotationDSKUByCustomerId = asyncHandler(async (req, res) => {
    try {
        const customerList = await getAllDSKUListByCustomerOrProspectId(req.query.customerId, req.user.company, {
            DSKU: "$_id",
            DSKUNo: "$dSKUNo",
            DSKUName: "$SKUName",
            DSKUDescription: "$SKUDescription",
            drawingRef: "$artWorkNo",
            UOM: "$primaryUnit",
            partNo: "$customerInfo.customerPartNo",
            srNo: null,
            MOQ: {$ifNull: ["$MOQ", 0]},
            QPrice: {$ifNull: ["$QPrice", 0]},
            developmentCost: {$ifNull: ["$developmentCost", 0]}
        });
        return res.success(customerList);
    } catch (e) {
        console.error("getAllSKUForQuotationSKU Quotation SKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getByIdForPDF = asyncHandler(async (req, res) => {
    try {
        let quotationData = await Model.aggregate([
            {
                $match: {
                    _id: ObjectId(req.params.id),
                    referenceModel: {$exists: true}
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
                        {
                            $project: {
                                customerName: 1,
                                customerBillingAddress: {$arrayElemAt: ["$customerBillingAddress", 0]}
                            }
                        }
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
                        {
                            $project: {
                                prospectName: 1,
                                currency: 1,
                                correspondenceAddress: "$correspondenceAddress",
                                contactDetails: {
                                    $arrayElemAt: ["$contactDetails", 0]
                                }
                            }
                        }
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
                $lookup: {
                    from: "Company",
                    localField: "company",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                _id: 0,
                                companyName: 1,
                                SOSignatureUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$SOSignature"]},
                                SOPdfHeaderUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$SOPdfHeader"]}
                            }
                        }
                    ],
                    as: "company"
                }
            },
            {$unwind: "$company"},
            {
                $project: {
                    customerName: 1,
                    quotationNo: 1,
                    RFQReference: 1,
                    customerCategory: 1,
                    quotationDetails: 1,
                    exchangeRate: 1,
                    SOSignatureUrl: "$company.SOSignatureUrl",
                    SOPdfHeaderUrl: "$company.SOPdfHeaderUrl",
                    quotationDate: {$dateToString: {format: "%d-%m-%Y", date: "$quotationDate"}},
                    customerBillingAddress: {
                        $cond: [
                            {$eq: ["$referenceModel", "Prospect"]},
                            "$prospects.correspondenceAddress",
                            "$customers.customerBillingAddress"
                        ]
                    },
                    contactPersonName: {
                        $cond: [
                            {$eq: ["$referenceModel", "Prospect"]},
                            "$contactDetails.contactPersonName",
                            "$customerContactInfo.contactPersonName"
                        ]
                    },
                    currency: 1
                }
            }
        ]);
        const display = await getQMSMappingByModuleAndTitle(req.user.company, "Sales", "Quotation Of D-SKU");
        let termsAndCondOfQuotation = [];
        if (await checkExportsCustomer(quotationData[0].customerCategory)) {
            termsAndCondOfQuotation = await getAllModuleMaster(req.user.company, "EXPORTS_TCS_OF_QUOTATION");
        } else {
            termsAndCondOfQuotation = await getAllModuleMaster(req.user.company, "TCS_OF_QUOTATION");
        }
        return res.success({quotation: quotationData[0] ? quotationData[0] : {}, termsAndCondOfQuotation, display});
    } catch (e) {
        console.error("getByIdForPDF Quotation DSKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        let prospects = await getAllProspects(req.user.company, {customerName: "$prospectName"});
        let customers = await getAllCustomers(req.user.company, {customerName: 1});
        for (let i = 0; i < prospects.length; i++) {
            const ele = prospects[i];
            customers.push(ele);
        }
        const {reference = null, toDate = null, fromDate = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!reference && {
                reference: ObjectId(reference)
            }),
            ...(!!toDate &&
                !!fromDate && {
                    quotationDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                }),
            status: OPTIONS.defaultStatus.REPORT_GENERATED
        };
        let project = getAllQuotationDSKUtAttributes();
        let pipeline = [
            {
                $match: query
            }
        ];
        let rows = await QuotationDSKURepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            ...rows,
            customers
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
