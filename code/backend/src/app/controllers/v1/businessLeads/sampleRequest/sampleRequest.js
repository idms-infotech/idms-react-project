const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllSampleRequestAttributes,
    getAllSampleReqReportsAttributes
} = require("../../../../models/businessLeads/helpers/sampleRequestHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {SAMPLE_REQUEST} = require("../../../../mocks/schemasConstant/businessLeadsConstant");
const SampleRequestRepository = require("../../../../models/businessLeads/repository/sampleRequestRepository");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {getAllTransporter} = require("../../sales/transporter/transporter");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {getCompanyLocations, getCompanyById} = require("../../settings/company/company");
const {getAllPaymentTerms} = require("../../sales/paymentTerms/paymentTerms");
const {OPTIONS} = require("../../../../helpers/global.options");
const {filteredSKUMasterList} = require("../../../../models/sales/repository/SKUMasterRepository");
const {JOB_CARD_STAGE} = require("../../../../mocks/constantData");
const {dateToAnyFormat, getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const {getAllCustomerCategory} = require("../../settings/customerCategory/customerCategory");
const {filteredLogisticsProviderList} = require("../../../../models/planning/repository/logisticsProviderRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllSampleRequestAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company), SRStatus: {$ne: OPTIONS.defaultStatus.REPORT_GENERATED}}}
        ];
        let rows = await SampleRequestRepository.getAllPaginate({
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
        const itemDetails = await SampleRequestRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Sample Request")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Sample Request", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await SampleRequestRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await SampleRequestRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Sample Request has been")
        });
    } catch (e) {
        console.error("update Sample Request", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await SampleRequestRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Sample Request")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Sample Request");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Sample Request", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await SampleRequestRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Sample Request");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Sample Request", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            SAMPLE_REQUEST.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
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
                    customerBillingObj: {$arrayElemAt: ["$customerBillingAddress", 0]}
                }
            },
            {
                $project: {
                    customerName: "$customerName",
                    customerCode: 1,
                    customerCategory: 1,
                    categoryType: 1,
                    customerPaymentTerms: 1,
                    customerCurrency: 1,
                    customerShippingAddress: 1,
                    customerBillingAddress: 1,
                    customerBillingState: "$customerBillingObj.state",
                    customerBillingCity: "$customerBillingObj.city",
                    customerBillingPinCode: "$customerBillingObj.pinCode"
                }
            }
        ]);
        let salesCategory = await getAllCustomerCategory(req.user.company);
        const transporter = await getAllTransporter(
            {
                company: ObjectId(req.user.company)
            },
            {label: "$name", value: "$name", _id: 0}
        );
        const logisticOptions = await filteredLogisticsProviderList([
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $lookup: {
                    from: "LSPCategory",
                    localField: "LSPCategory",
                    foreignField: "category",
                    pipeline: [
                        {
                            $match: {
                                transporterCategory: true
                            }
                        },
                        {
                            $project: {
                                _id: 1
                            }
                        }
                    ],
                    as: "LSPCategory"
                }
            },
            {$unwind: "$LSPCategory"},
            {
                $project: {label: "$LSPName", value: "$LSPName", _id: 0}
            }
        ]);
        const freightTermsOptions = await getAllModuleMaster(req.user.company, "FREIGHT_TERMS");
        const modeOfTransportOptions = await getAllModuleMaster(req.user.company, "MODE_OF_TRANSPORT");
        const billFromLocation = await getCompanyLocations(req.user.company);
        const companyData = await getCompanyById(req.user.company, {placesOfBusiness: 1});
        const paymentTerms = await getAllPaymentTerms(req.user.company);
        return res.success({
            autoIncrementNo,
            customerOptions: customers,
            companyData,
            salesCategoryOptions: salesCategory.map(x => {
                return {
                    category: x?.category,
                    categoryType: x?.categoryType
                };
            }),
            paymentTermsOptions: paymentTerms.map(x => {
                return {
                    label: x.paymentDescription,
                    value: x.paymentDescription
                };
            }),
            billFromLocationOptions: billFromLocation?.split(",")?.map(x => {
                return {
                    label: x,
                    value: x
                };
            }),
            transporterOptions: [...logisticOptions, ...transporter],
            freightTermsOptions,
            modeOfTransportOptions,
        });
    } catch (error) {
        console.error("getAllMasterData Sample Request", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllSampleSKUList = asyncHandler(async (req, res) => {
    try {
        const SKUList = await filteredSKUMasterList([
            {
                $match: {
                    isActive: "A",
                    SKUStage: JOB_CARD_STAGE.PROTOTYPE,
                    "customerInfo.customer": ObjectId(req.query.customerId)
                }
            },
            {$unwind: {path: "$customerInfo", preserveNullAndEmptyArrays: true}},
            {
                $addFields: {
                    discount: 0,
                    orderedQty: 0,
                    invoicedQty: 0,
                    canceledQty: 0,
                    balancedQty: 0,
                    lineValue: 0,
                    returnQty: 0
                }
            },
            {
                $project: {
                    SKU: "$_id",
                    customerCurrency: "$customerCurrency",
                    SKUNo: 1,
                    SKUName: 1,
                    UOM: "$primaryUnit",
                    SKUDescription: 1,
                    customerPartNo: "$customerInfo.customerPartNo",
                    productCategory: 1,
                    SOLineTargetDate: dateToAnyFormat(new Date(), "YYYY-MM-DD"),
                    discount: 1,
                    netRate: "$customerInfo.standardSellingRate",
                    orderedQty: 1,
                    invoicedQty: 1,
                    canceledQty: 1,
                    balancedQty: 1,
                    productCode: 1,
                    lineValue: 1,
                    standardRate: "$customerInfo.standardSellingRate",
                    customer: "$customerInfo.customer",
                    customerName: "$customerInfo.customerName"
                }
            }
        ]);
        return res.success(SKUList);
    } catch (e) {
        console.error("getAllSampleSKUList", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const {toDate = null, fromDate = null} = req.query;
        let project = getAllSampleReqReportsAttributes();
        let query = {
            company: ObjectId(req.user.company),
            SRStatus: OPTIONS.defaultStatus.REPORT_GENERATED,
            ...(!!toDate &&
                !!fromDate && {
                    SRDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let pipeline = [
            {$match: query},
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {customerName: 1, customerNickName: 1}}],
                    as: "customer"
                }
            },
            {$unwind: "$customer"},
            {$unwind: "$SRDetails"},
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "SRDetails.SKU",
                    foreignField: "_id",
                    pipeline: [{$project: {SKUName: 1, SKUDescription: 1, SKUNo: 1}}],
                    as: "SRDetails.SKU"
                }
            },
            {$unwind: "$SRDetails.SKU"},
            {$unwind: "$SRDetails.dispatchSchedule"}
        ];
        let rows = await SampleRequestRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        SOTotalAmount: {$sum: {$toDouble: "$lineValue"}}
                    }
                },
                {
                    $project: {
                        SOTotalAmount: {$round: ["$SOTotalAmount", 2]},
                        _id: 0
                    }
                }
            ]
        });
        return res.success(rows);
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllSRbyCustomerIdForJobCard = async (customerId, company) => {
    try {
        return SampleRequestRepository.filteredSampleRequestList([
            {
                $match: {
                    customer: ObjectId(customerId),
                    company: ObjectId(company),
                    "SRDetails.balancedQty": {$gt: 0},
                    SRStatus: {
                        $in: [OPTIONS.defaultStatus.APPROVED, OPTIONS.defaultStatus.REPORT_GENERATED]
                    }
                }
            },
            {
                $unwind: "$SRDetails"
            },
            {
                $lookup: {
                    from: "FGIN",
                    localField: "SRDetails.SKU",
                    foreignField: "SKUId",
                    pipeline: [
                        {
                            $match: {
                                FGINQuantity: {$gt: 0},
                                $or: [{expiryDate: {$gt: new Date()}}, {expiryDate: null}]
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                batchNo: 1,
                                batchDate: "$manufacturingDate",
                                UOM: 1,
                                FGQty: "$FGINQuantity",
                                aging: {
                                    $cond: {
                                        if: {
                                            $or: [
                                                {$eq: ["$expiryDate", null]},
                                                {$gte: ["$expiryDate", {$add: [new Date(), 30 * 24 * 60 * 60 * 1000]}]}
                                            ]
                                        },
                                        then: "green",
                                        else: {
                                            $cond: {
                                                if: {
                                                    $gt: ["$expiryDate", new Date()]
                                                },
                                                then: "yellow",
                                                else: "red"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ],
                    as: "inventory"
                }
            },
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "SRDetails.SKU",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                SKUNo: 1,
                                SKUName: 1,
                                SKUDescription: 1,
                                drawing: "$artWorkHyperLink",
                                primaryUnit: 1,
                                internalPartNo: 1
                            }
                        }
                    ],
                    as: "SKU"
                }
            },
            {$unwind: "$SKU"},
            {
                $lookup: {
                    from: "MapCategoryHSN",
                    localField: "salesCategory",
                    foreignField: "productCategory",
                    pipeline: [{$project: {_id: 0, colourName: 1}}],
                    as: "mapCategory"
                }
            },
            {$unwind: {path: "$mapCategory", preserveNullAndEmptyArrays: true}},
            {
                $project: {
                    _id: 0,
                    lineNumber: "$SRDetails.SRLineNumber",
                    reference: "$_id",
                    referenceModel: "SampleRequest",
                    SO_FCNumber: "$sampleReqNo",
                    SO_FCDate: "$SRDate",
                    code: {$ifNull: ["$mapCategory.colourName", "#fa0096"]},
                    SKU: "$SKU._id",
                    SKUNo: "$SKU.SKUNo",
                    SKUName: "$SKU.SKUName",
                    SKUDescription: "$SKU.SKUDescription",
                    drawing: "$SKU.drawing",
                    UOM: "$SKU.primaryUnit",
                    internalPartNo: "$SKU.internalPartNo",
                    balQty: {$ifNull: ["$SRDetails.JCCQty", 0]},
                    totalFGQty: {
                        $reduce: {
                            input: "$inventory",
                            initialValue: 0,
                            in: {$add: ["$$value", "$$this.FGQty"]}
                        }
                    },
                    batchQty: {$literal: 0},
                    FGInventoryInfo: "$inventory",
                    dispatchSchedule: {
                        $cond: {
                            if: {
                                $and: [
                                    {$ne: [{$type: "$SRDetails.dispatchSchedule"}, "missing"]},
                                    {$gt: [{$size: {$ifNull: ["$SRDetails.dispatchSchedule", []]}}, 0]}
                                ]
                            },
                            then: "$SRDetails.dispatchSchedule",
                            else: [
                                {
                                    scheduleNo: 1,
                                    quantity: "$SRDetails.orderedQty",
                                    dispatchDate: "$SRDetails.SRLineTargetDate"
                                }
                            ]
                        }
                    },
                    SO_FCLineTargetDate: "$SRDetails.SRLineTargetDate"
                }
            }
        ]);
    } catch (e) {
        console.error("getAllSRbyCustomerIdForJobCard", e);
    }
};

exports.updateSRQtyOnJCC = async (updatedBy, SRId, updateSKUId, qty, status, lineNumber) => {
    try {
        const sampleRequest = await SampleRequestRepository.getDocById(SRId);
        if (sampleRequest) {
            const newSRDetails = sampleRequest.SRDetails.map(ele => {
                if (
                    [OPTIONS.defaultStatus.CANCELLED].includes(status) &&
                    ele.SKU._id.toString() === updateSKUId.toString() &&
                    ele.SRLineNumber == lineNumber
                ) {
                    ele.JCCQty = +ele.JCCQty + +qty;
                    ele.previousJCCQty = 0;
                } else if (ele.SKU._id.toString() === updateSKUId.toString() && ele.SRLineNumber == lineNumber) {
                    ele.JCCQty = +ele.JCCQty + +ele.previousJCCQty - +qty;
                    ele.previousJCCQty = qty;
                }
                return ele;
            });
            sampleRequest.updatedBy = updatedBy;
            sampleRequest.SRDetails = newSRDetails;
            const updatedNewSFDetails = await sampleRequest.save();
            return updatedNewSFDetails;
        }
    } catch (error) {
        console.error("updateSRQtyOnJCC::::: Error in updating Sale Order ======= ", error);
    }
};
