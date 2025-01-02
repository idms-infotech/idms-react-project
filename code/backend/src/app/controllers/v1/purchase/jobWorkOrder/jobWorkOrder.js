const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllJobWorkOrderAttributes,
    getAllJobWorkOrderReportsAttributes
} = require("../../../../models/purchase/helpers/jobWorkOrderHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {JOB_WORK_ORDER} = require("../../../../mocks/schemasConstant/purchaseConstant");
const JobWorkOrderRepository = require("../../../../models/purchase/repository/jobWorkOrderRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const {filteredServiceMasterList} = require("../../../../models/purchase/repository/serviceMasterRepository");
const {getAllPaymentTerms} = require("../../sales/paymentTerms/paymentTerms");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {filteredCompanyList} = require("../../../../models/settings/repository/companyRepository");
const {CONSTANTS} = require("../../../../../config/config");
const {COMPANY_DEPARTMENTS} = require("../../../../mocks/constantData");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const {filteredSupplierList} = require("../../../../models/purchase/repository/supplierRepository");
const {filteredItemList} = require("../../../../models/purchase/repository/itemRepository");
const {getAllCheckedSupplierCategoriesList} = require("../../settings/supplierCategory/supplierCategory");
const {filteredJWIItemStdCostList} = require("../../../../models/planning/repository/JWIItemStdCostRepository");
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllJobWorkOrderAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company), status: {$nin: [OPTIONS.defaultStatus.REPORT_GENERATED]}}}
        ];
        let rows = await JobWorkOrderRepository.getAllPaginate({
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
        const itemDetails = await JobWorkOrderRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Job Work Order")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Job Work Order", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await JobWorkOrderRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await JobWorkOrderRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Job Work Order has been")
        });
    } catch (e) {
        console.error("update Job Work Order", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await JobWorkOrderRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Job Work Order")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Job Work Order");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Job Work Order", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await JobWorkOrderRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Job Work Order");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Job Work Order", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getByIdForPDF = asyncHandler(async (req, res) => {
    try {
        let existing = await JobWorkOrderRepository.filteredJobWorkOrderList([
            {
                $match: {
                    _id: ObjectId(req.params.id)
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
                                logoUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$logo"]},
                                companySignatureUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$companySignature"]},
                                contactInfo: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$contactInfo",
                                                as: "info",
                                                cond: {$eq: ["$$info.department", COMPANY_DEPARTMENTS.PURCHASE]}
                                            }
                                        },
                                        0
                                    ]
                                }
                            }
                        }
                    ],
                    as: "company"
                }
            },
            {$unwind: "$company"}
        ]);
        if (!existing.length) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Job Work Order");
            return res.unprocessableEntity(errors);
        } else {
            existing = existing[0];
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Job Work Order", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            JOB_WORK_ORDER.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
        let supplierCategoryList = await getAllCheckedSupplierCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            jobWorker: true
        });
        if (supplierCategoryList.length) {
            supplierCategoryList = supplierCategoryList.map(x => x.category);
        }
        const jobWorkerOptions = await filteredSupplierList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isSupplierActive: "A",
                    supplierPurchaseType: {$in: supplierCategoryList}
                }
            },
            {$sort: {supplierName: 1}},
            {
                $addFields: {
                    supplierShippingAddress: {$concatArrays: ["$supplierBillingAddress", "$supplierShippingAddress"]},
                    supplierBillingAddress: {$first: "$supplierBillingAddress"}
                }
            },
            {
                $project: {
                    jobWorker: "$_id",
                    jobWorkerName: "$supplierName",
                    currency: "$supplierCurrency",
                    jobWorkerCode: "$supplierCode",
                    state: "$supplierBillingAddress.state",
                    cityOrDistrict: "$supplierBillingAddress.city",
                    pinCode: "$supplierBillingAddress.pinCode",
                    GSTINNo: "$supplierGST",
                    supplierBillingAddress: "$supplierBillingAddress",
                    supplierShippingAddress: 1
                }
            }
        ]);
        const companyAddress = await filteredCompanyList([
            {
                $match: {
                    _id: ObjectId(req.user.company)
                }
            },
            {$unwind: "$placesOfBusiness"},
            {
                $addFields: {
                    "placesOfBusiness.companyName": "$companyName"
                }
            },
            {$replaceRoot: {newRoot: "$placesOfBusiness"}},
            {
                $project: {
                    companyName: 1,
                    locationID: "$locationID",
                    GSTIN: "$GSTINForAdditionalPlace",
                    line1: "$addressLine1",
                    line2: "$addressLine2",
                    line3: "$addressLine3",
                    line4: "$addressLine4",
                    state: "$state",
                    city: "$city",
                    district: "$district",
                    pinCode: "$pinCode",
                    country: "$country"
                }
            }
        ]);
        const serviceMastersOptions = await filteredServiceMasterList([
            {$match: {company: ObjectId(req.user.company), isActive: "Y"}},
            {
                //For Filtration I have used lookup
                $lookup: {
                    from: "SAC",
                    localField: "sacId",
                    foreignField: "_id",
                    as: "sacId"
                }
            },
            {$unwind: "$sacId"},
            {$sort: {serviceCode: -1}},
            {
                $project: {
                    _id: 1,
                    serviceCode: 1,
                    sacCode: 1,
                    serviceDescription: 1,
                    gst: 1,
                    igst: 1,
                    sgst: 1,
                    cgst: 1,
                    ugst: 1
                }
            }
        ]);
        const paymentTerms = await getAllPaymentTerms(req.user.company);
        const freightTermsOptions = await getAllModuleMaster(req.user.company, "FREIGHT_TERMS");
        const jobWODiscountOptions = await getAllModuleMaster(req.user.company, "JOB_WO_DISCOUNT");

        return res.success({
            autoIncrementNo,
            jobWorkerOptions,
            serviceMastersOptions,
            paymentTermsOptions: paymentTerms.map(x => {
                return {
                    label: x.paymentDescription,
                    value: x.paymentDescription
                };
            }),
            freightTermsOptions,
            jobWODiscountOptions,
            companyAddress
        });
    } catch (error) {
        console.error("getAllMasterData Job Work Order", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getJWItemsByJobWorker = asyncHandler(async (req, res) => {
    try {
        const JWItemsOptions = await filteredJWIItemStdCostList([
            // {
            //     $match: {
            //         company: ObjectId(req.user.company)
            //     }
            // },
            {
                $lookup: {
                    from: "JobWorkItemMaster",
                    localField: "jobWorkItem",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                jobWorkItemCode: 1,
                                jobWorkItemName: 1,
                                jobWorkItemDescription: 1,
                                orderInfoUOM: 1,
                                HSNCode: 1,
                                gst: 1,
                                igst: 1,
                                cgst: 1,
                                sgst: 1,
                                ugst: 1
                            }
                        }
                    ],
                    as: "JWItemInfo"
                }
            },
            {
                $unwind: {
                    path: "$JWItemInfo",
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $unwind: {
                    path: "$jobWorkerDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    "jobWorkerDetails.jobWorker": ObjectId(req.params.id)
                }
            },
            {
                $project: {
                    jobWorkItem: "$jobWorkItem",
                    jobWorkItemCode: "$JWItemInfo.jobWorkItemCode",
                    jobWorkItemName: "$JWItemInfo.jobWorkItemName",
                    jobWorkItemDescription: "$JWItemInfo.jobWorkItemDescription",
                    orderInfoUOM: "$JWItemInfo.orderInfoUOM",
                    HSNCode: "$JWItemInfo.HSNCode",
                    partNo: {$literal: null},
                    gst: "$JWItemInfo.gst",
                    igst: "$JWItemInfo.igst",
                    cgst: "$JWItemInfo.cgst",
                    sgst: "$JWItemInfo.sgst",
                    ugst: "$JWItemInfo.ugst",
                    processRatePerUnit: "$jobWorkerDetails.totalJWItemCost"
                }
            },
            {$sort: {jobWorkItemCode: 1}}
        ]);
        return res.success({JWItemsOptions});
    } catch (e) {
        console.error("getById Job Work Order", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const {jobWorker = null, toDate = null, fromDate = null} = req.query;
        const jobWorkerOptions = await filteredSupplierList([
            {$match: {company: ObjectId(req.user.company), isSupplierActive: "A"}},
            {$sort: {supplierName: 1}},
            {
                $project: {
                    jobWorker: "$_id",
                    jobWorkerName: "$supplierName"
                }
            }
        ]);
        let query = {
            company: ObjectId(req.user.company),
            status: {$in: [OPTIONS.defaultStatus.REPORT_GENERATED]},
            ...(!!jobWorker && {
                jobWorker: ObjectId(jobWorker)
            }),
            ...(!!toDate &&
                !!fromDate && {
                    WODate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = getAllJobWorkOrderReportsAttributes();
        let pipeline = [{$match: query}];
        let rows = await JobWorkOrderRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        WOTaxableValue: {$sum: "$WOTaxableValue"}
                    }
                },
                {
                    $project: {
                        WOTaxableValue: {$round: ["$WOTaxableValue", 2]}
                    }
                }
            ]
        });
        return res.success({...rows, jobWorkerOptions});
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
