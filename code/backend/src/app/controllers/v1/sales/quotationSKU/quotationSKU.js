const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/sales/quotationSKUModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {OPTIONS, generateCreateData} = require("../../../../helpers/global.options");
const {getAllCustomers} = require("../customerMaster/customerMaster");
const {getAllQuotationSKUtAttributes} = require("../../../../models/sales/helpers/quotationSKUHelper");
const {default: mongoose} = require("mongoose");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const {CONSTANTS} = require("../../../../../config/config");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {getQMSMappingByModuleAndTitle} = require("../../settings/report-qms-mapping/report-qms-mapping");
const {SALES_CATEGORY, JOB_CARD_STAGE} = require("../../../../mocks/constantData");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {QUOTATION_SKU} = require("../../../../mocks/schemasConstant/salesConstant");
const QuotationSKURepository = require("../../../../models/sales/repository/quotationSKURepository");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const {filteredSKUMasterList} = require("../../../../models/sales/repository/SKUMasterRepository");
const {getAllCustomerCategory} = require("../../settings/customerCategory/customerCategory");
const {featureConfig} = require("../../../../models/settings/repository/subModuleRepository");
const ObjectId = mongoose.Types.ObjectId;
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllQuotationSKUtAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: {$ne: OPTIONS.defaultStatus.REPORT_GENERATED}
                }
            }
        ];
        let rows = await QuotationSKURepository.getAllPaginate({
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
                message: MESSAGES.apiSuccessStrings.ADDED("Quotation SKU")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Quotation SKU", e);
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
            message: `Quotation SKU has been ${
                itemDetails.status == "Created" ? "updated" : itemDetails.status.toLowerCase()
            } successfully`
        });
    } catch (e) {
        console.error("update Quotation SKU", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("Quotation SKU")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Quotation SKU");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Quotation SKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Quotation SKU");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Quotation SKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...QUOTATION_SKU.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        let salesCategory = await getAllCustomerCategory(req.user.company);
        exportsTermsAndCond = await getAllModuleMaster(req.user.company, "EXPORTS_TCS_OF_QUOTATION");
        const serviceChargesList = await getAllModuleMaster(req.user.company, "ADDITIONAL_CHARGES_OF_QUOTATION_SKU");
        domesticTermsAndCond = await getAllModuleMaster(req.user.company, "TCS_OF_QUOTATION");
        return res.success({
            autoIncrementNo,
            exportsTermsAndCond,
            domesticTermsAndCond,
            serviceChargesList,
            salesCategoryOptions: salesCategory.map(x => {
                return {
                    category: x?.category,
                    categoryType: x?.categoryType
                };
            })
        });
    } catch (error) {
        console.error("getAllMasterData Quotation SKU", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllQuotationSKU = async (company, project = {}) => {
    try {
        let rows = await Model.find(
            {
                company: company
            },
            project
        ).sort({quotationNo: 1});
        return rows;
    } catch (e) {
        console.error("getAllQuotationSKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return errors;
    }
};

exports.getAllCustomersForQuotationSKUByCategory = asyncHandler(async (req, res) => {
    try {
        const customerList = await filteredCustomerList([
            {
                $match: {
                    isCustomerActive: "A",
                    customerCategory: req.query.customerCategory,
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
        return res.success(customerList);
    } catch (e) {
        console.error("getAllCustomersForQuotationSKU Quotation SKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllSKUForQuotationSKUByCustomerId = asyncHandler(async (req, res) => {
    try {
        let SKUStageFilter = await featureConfig(null, true, "QUOTATION_OF_SKU_FILTER");
        SKUStageFilter = SKUStageFilter?.length ? SKUStageFilter[0]?.value : "All";
        const customerList = await filteredSKUMasterList([
            {
                $match: {
                    ...(SKUStageFilter == JOB_CARD_STAGE.PROTOTYPE && {
                        SKUStage: JOB_CARD_STAGE.PROTOTYPE
                    }),
                    isActive: "A"
                }
            },
            {$unwind: {path: "$customerInfo", preserveNullAndEmptyArrays: true}},
            {$match: {"customerInfo.customer": ObjectId(req.query.customerId)}},
            {
                $project: {
                    SKU: "$_id",
                    SKUNo: 1,
                    SKUName: 1,
                    SKUDescription: 1,
                    drawingRef: "$artWorkNo",
                    UOM: "$primaryUnit",
                    partNo: "$customerInfo.customerPartNo",
                    srNo: null,
                    MOQ: {$ifNull: ["$MOQ", 0]},
                    QPrice: {$ifNull: ["$QPrice", 0]},
                    developmentCost: {$ifNull: ["$developmentCost", 0]},
                    discount: {$literal: 0},
                    orderedQty: {$literal: 0},
                    invoicedQty: {$literal: 0},
                    canceledQty: {$literal: 0},
                    balancedQty: {$literal: 0},
                    lineValue: {$literal: 0},
                    returnQty: {$literal: 0}
                }
            }
        ]);
        return res.success(customerList);
    } catch (e) {
        console.error("getAllSKUForQuotationSKU Quotation SKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const customers = await getAllCustomers(req.user.company, {customerName: 1, company: 0});
        const {customer = null, toDate = null, fromDate = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!customer && {
                customer: ObjectId(customer)
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
        let project = getAllQuotationSKUtAttributes();
        let pipeline = [
            {
                $match: query
            }
        ];
        let rows = await QuotationSKURepository.getAllPaginate({
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

exports.getByIdForPDF = asyncHandler(async (req, res) => {
    try {
        let quotationData = await Model.aggregate([
            {
                $match: {
                    _id: ObjectId(req.params.id),
                    company: ObjectId(req.user.company)
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
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                customerName: 1,
                                customerCurrency: 1,
                                customerBillingAddress: {
                                    $arrayElemAt: ["$customerBillingAddress", 0]
                                },
                                customerContactInfo: {
                                    $arrayElemAt: ["$customerContactInfo", 0]
                                }
                            }
                        }
                    ],
                    as: "customer"
                }
            },
            {
                $unwind: {
                    path: "$customer",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    customerName: 1,
                    quotationNo: 1,
                    RFQReference: 1,
                    customerCategory: 1,
                    quotationDate: {$dateToString: {format: "%d-%m-%Y", date: "$quotationDate"}},
                    customerBillingAddress: "$customer.customerBillingAddress",
                    contactPersonName: "$customer.customerContactInfo.contactPersonName",
                    currency: 1,
                    quotationDetails: 1,
                    exchangeRate: 1,
                    SOSignatureUrl: "$company.SOSignatureUrl",
                    SOPdfHeaderUrl: "$company.SOPdfHeaderUrl",
                    termsAndCond: 1
                }
            }
        ]);
        let termsAndCondOfQuotation = [];
        if (SALES_CATEGORY.getAllExportsSalesCategory().includes(quotationData[0].customerCategory)) {
            termsAndCondOfQuotation = await getAllModuleMaster(req.user.company, "EXPORTS_TCS_OF_QUOTATION");
        } else {
            termsAndCondOfQuotation = await getAllModuleMaster(req.user.company, "TCS_OF_QUOTATION");
        }
        const display = await getQMSMappingByModuleAndTitle(req.user.company, "Sales", "Quotation Of SKU");
        return res.success({
            quotation: quotationData[0] ? quotationData[0] : {},
            display,
            termsAndCondOfQuotation: termsAndCondOfQuotation
        });
    } catch (e) {
        console.error("getByIdForPDF Quotation SKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
