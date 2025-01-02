const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/sales/creditNoteModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {outputData, getAllAggregationFooter} = require("../../../../helpers/utility");
const {generateCreateData, getMatchData, OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {getAllCustomers} = require("../customerMaster/customerMaster");
const {getAllSKUs} = require("../SKU/SKU");
const {
    getFirstDayOfFiscalYear,
    getLastDayOfFiscalYear,
    getFirstDateOfMonth,
    getLastDateOfMonth
} = require("../../../../utilities/utility");
const {getSalesHSNByCode} = require("../salesHSN/salesHSN");
const {CONSTANTS} = require("../../../../../config/config");
const {getEndDateTime, getStartDateTime, dateToAnyFormat} = require("../../../../helpers/dateTime");
const {SALES_CATEGORY, COMPANY_DEPARTMENTS} = require("../../../../mocks/constantData");
const {
    getAllCreditNoteAttributes,
    getAllCreditNoteExcelAttributes,
    getAllCreditNoteReportsAttributes,
    getAllCNSummaryReportsAttributes,
    getAllCNDetailsReportsAttributes
} = require("../../../../models/sales/helpers/creditNoteHelper");
// const {getCNMailConfig} = require("./creditNoteMail");
const {LAKH} = require("../../../../mocks/number.constant");
const {CREDIT_NOTE} = require("../../../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const CreditNoteRepository = require("../../../../models/sales/repository/creditNoteRepository");
const ObjectId = mongoose.Types.ObjectId;
const MailTriggerRepository = require("../../../../models/settings/repository/mailTriggerRepository");
const {SALES_MAIL_CONST} = require("../../../../mocks/mailTriggerConstants");
const {filteredReasonForCNList} = require("../../../../models/settings/repository/reasonForCNRepository");
const {filteredSalesServiceMasterList} = require("../../../../models/sales/repository/salesServiceMasterRepository");
const {filteredSKUMasterList} = require("../../../../models/sales/repository/SKUMasterRepository");
// @route   GET /sales/credit Note/getAll
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllCreditNoteAttributes();
        if (req.query.excel == "true") {
            project = getAllCreditNoteExcelAttributes();
        }
        let pipeline = [
            {$match: {company: ObjectId(req.user.company), CNStatus: {$in: ["Awaiting Approval", "Approved"]}}},
            {
                $addFields: {
                    netCNValue: {$toString: "$netCNValue"},
                    CNDateS: {$dateToString: {format: "%d-%m-%Y", date: "$CNDate"}},
                    invoiceDateS: {$dateToString: {format: "%d-%m-%Y", date: "$invoiceDate"}}
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {customerName: 1}}],
                    as: "customer"
                }
            },
            {$unwind: "$customer"}
        ];
        let rows = await CreditNoteRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllCN", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @route   POST /sales/credit Note/create
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
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Credit Note")
            });
            // let mailCreateObj = {
            //     CNId: itemDetails._id,
            //     action: "created",
            //     company: req.user.company,
            //     mailAction: "Create"
            // };
            // getCNMailConfig(mailCreateObj);
            let mailTriggerCreateObj = {
                subModuleId: itemDetails._id,
                action: "created",
                company: req.user.company,
                mailAction: "Create",
                collectionName: CREDIT_NOTE.COLLECTION_NAME,
                message: `Credit Note Created - ${itemDetails.CNNumber}`,
                module: SALES_MAIL_CONST.CREDIT_NOTE.MODULE,
                subModule: SALES_MAIL_CONST.CREDIT_NOTE.SUB_MODULE,
                isSent: false
            };
            await MailTriggerRepository.createDoc(mailTriggerCreateObj);
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Credit note", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @route   PUT /sales/credit Note/update/:id
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await Model.findById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await generateCreateData(itemDetails, req.body);
        itemDetails = await itemDetails.save();
        if (itemDetails) {
            res.success({
                message: `Credit Note has been ${
                    itemDetails.CNStatus == OPTIONS.defaultStatus.AWAITING_APPROVAL
                        ? "updated"
                        : itemDetails.CNStatus.toLowerCase()
                } successfully`
            });
            // let mailUpdateObj = {
            //     CNId: itemDetails._id,
            //     action: "modified",
            //     company: req.user.company,
            //     mailAction: itemDetails.CNStatus
            // };
            // getCNMailConfig(mailUpdateObj);
            if (["Awaiting Approval", "Report Generated"].includes(itemDetails.CNStatus)) {
                let actions = {
                    "Awaiting Approval": "Modified",
                    "Report Generated": "Report Generated"
                };
                let mailTriggerCreateObj = {
                    subModuleId: itemDetails._id,
                    action: actions[itemDetails.CNStatus],
                    company: req.user.company,
                    mailAction: actions[itemDetails.CNStatus],
                    collectionName: CREDIT_NOTE.COLLECTION_NAME,
                    message: `Credit Note ${actions[itemDetails.CNStatus]} - ${itemDetails.CNNumber}`,
                    module: SALES_MAIL_CONST.CREDIT_NOTE.MODULE,
                    subModule: SALES_MAIL_CONST.CREDIT_NOTE.SUB_MODULE,
                    isSent: false
                };
                await MailTriggerRepository.createDoc(mailTriggerCreateObj);
            }
        }
    } catch (e) {
        console.error("update Credit Note", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @route   PUT /sales/credit Note/delete/:id
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Credit Note")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Credit Note");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Credit Note", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @route   GET /sales/credit Note/getById/:id
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await CreditNoteRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Credit Note");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Credit Note", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @route   GET /sales/credit Note/getCNDetailsById/:id
exports.getCNDetailsById = asyncHandler(async (req, res) => {
    try {
        let existing = await CreditNoteRepository.filteredCreditNoteList([
            {
                $match: {
                    _id: ObjectId(req.params.id)
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                customerName: 1,
                                GSTIN: 1,
                                customerBillingAddress: 1,
                                customerContactInfo: 1,
                                categoryType: 1
                            }
                        }
                    ],
                    as: "customer"
                }
            },
            {$unwind: "$customer"},
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "CNDetails.SKU",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                SKUNo: 1,
                                SKUName: 1,
                                SKUDescription: 1,
                                customerInfo: 1,
                                hsn: 1
                            }
                        }
                    ],
                    as: "SKUInfo"
                }
            },
            {
                $addFields: {
                    CNDetails: {
                        $map: {
                            input: "$CNDetails",
                            as: "detail",
                            in: {
                                $mergeObjects: [
                                    "$$detail",
                                    {
                                        SKU: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: "$SKUInfo",
                                                        as: "sku",
                                                        cond: {$eq: ["$$sku._id", "$$detail.SKU"]}
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "Company",
                    localField: "company",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $addFields: {
                                contactInfo: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$contactInfo",
                                                as: "info",
                                                cond: {$eq: ["$$info.department", COMPANY_DEPARTMENTS.SALES]}
                                            }
                                        },
                                        0
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                companyName: 1,
                                GSTIN: 1,
                                companyBillingAddress: 1,
                                companySignatureUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$companySignature"]},
                                SOPdfHeaderUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$SOPdfHeader"]},
                                companyContactPersonNumber: "$contactInfo.companyContactPersonNumber",
                                companyContactPersonEmail: "$contactInfo.companyContactPersonEmail"
                            }
                        }
                    ],
                    as: "company"
                }
            },
            {$unwind: "$company"}
        ]);
        if (!existing.length) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Credit Note");
            return res.unprocessableEntity(errors);
        } else {
            existing = await getDataPDF(existing[0]);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Credit Note", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @route   GET /sales/credit Note/getAllMasterData
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...CREDIT_NOTE.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        const customersOptions = await filteredCustomerList([
            {$match: {company: ObjectId(req.user.company), isCustomerActive: "A"}},
            {$sort: {customerName: 1}},
            {
                $addFields: {
                    customerBillingAddress: {$arrayElemAt: ["$customerBillingAddress", 0]}
                }
            },
            {
                $project: {
                    label: "$customerName",
                    value: "$_id",
                    customerCategory: 1,
                    customerCurrency: 1,
                    categoryType: 1,
                    customerCode: 1,
                    customerBillingState: "$customerBillingAddress.state",
                    customerBillingCity: "$customerBillingAddress.city",
                    customerBillingPinCode: "$customerBillingAddress.pinCode"
                }
            }
        ]);
        const reasonsForCNOptions = await filteredReasonForCNList([
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $sort: {
                    order: 1
                }
            },
            {
                $project: {
                    reasonCategory: 1,
                    reasonDesc: 1
                }
            }
        ]);
        const servicesOptions = await filteredSalesServiceMasterList([
            {$match: {company: ObjectId(req.user.company), isActive: "Yes"}},
            {$sort: {serviceCode: -1}},
            {
                $project: {
                    serviceMaster: "$_id",
                    descOfService: "$serviceDescription",
                    SACCode: "$sacCode",
                    creditValue: {$literal: 0}
                }
            }
        ]);
        return res.success({
            autoIncrementNo,
            customersOptions,
            reasonsForCNOptions,
            servicesOptions
        });
    } catch (error) {
        console.error("getAllMasterData Credit Note", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @route   GET /sales/credit Note/getById/:id
exports.getAllCreditNoteByCustomerId = asyncHandler(async (req, res) => {
    try {
        const SKUList = await filteredSKUMasterList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isActive: "A"
                }
            },
            {
                $unwind: "$customerInfo"
            },
            {
                $match: {
                    "customerInfo.customer": ObjectId(req.params.id)
                }
            },
            {
                $lookup: {
                    from: "SaleHSN",
                    localField: "hsn",
                    foreignField: "hsnCode",
                    pipeline: [
                        {
                            $project: {
                                gst: "$gstRateRate",
                                igst: "$igstRate",
                                cgst: "$cgstRate",
                                sgst: "$sgstRate"
                            }
                        }
                    ],
                    as: "salesHSN"
                }
            },
            {$unwind: "$salesHSN"},
            {
                $addFields: {
                    sellingRateCommon: {$first: "$customerInfo.sellingRateCommon"}
                }
            },

            {
                $project: {
                    SKU: "$_id",
                    SKUNo: "$SKUNo",
                    SKUName: "$SKUName",
                    SKUDescription: "$SKUDescription",
                    CPartNo: "$customerInfo.customerPartNo",
                    hsn: "$hsn",
                    gst: "$salesHSN.gst",
                    igst: "$salesHSN.igst",
                    cgst: "$salesHSN.cgst",
                    sgst: "$salesHSN.sgst",
                    UOM: "$primaryUnit",
                    returnQty: {$literal: 0},
                    purchaseRate: "$sellingRateCommon.rate1",
                    lineValue: {$literal: 0}
                }
            }
        ]);
        return res.success(SKUList);
    } catch (e) {
        console.error("getAllByCustomerId Credit Note", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        let customers = await getAllCustomers(req.user.company, {customerName: 1});
        const {customer = null, fromDate = null, toDate = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!customer && {
                customer: {$eq: ObjectId(customer)}
            }),
            CNStatus: OPTIONS.defaultStatus.REPORT_GENERATED,
            ...(!!toDate &&
                !!fromDate && {
                    CNDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = getAllCreditNoteReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $addFields: {
                    CNDateS: {$dateToString: {format: "%d-%m-%Y", date: "$CNDate"}},
                    invoiceDateS: {$dateToString: {format: "%d-%m-%Y", date: "$invoiceDate"}}
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {customerName: 1}}],
                    as: "customer"
                }
            },
            {
                $unwind: {
                    path: "$customer",
                    preserveNullAndEmptyArrays: true
                }
            }
        ];
        let rows = await CreditNoteRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        netCNValue: {$sum: {$toDouble: "$netCNValue"}}
                    }
                },
                {
                    $project: {
                        netCNValue: {$round: ["$netCNValue", 2]},
                        _id: 0
                    }
                }
            ]
        });
        return res.success({
            customers,
            ...rows
        });
    } catch (e) {
        console.error("getAllCNReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
async function getDataPDF(existing) {
    try {
        if (existing.customer?.customerContactInfo?.length) {
            existing.customer.customerContactInfo = existing.customer.customerContactInfo[0];
        }
        if (existing.customer?.customerBillingAddress?.length) {
            existing.customer.customerBillingAddress = existing.customer.customerBillingAddress[0];
        }
        if (existing.customer?.customerShippingAddress?.length) {
            existing.customer.customerShippingAddress = existing.customer.customerShippingAddress[0];
        }
        if (existing.CNDetails.length) {
            let array = [];
            for await (const x of existing?.CNDetails) {
                let HSN = await getSalesHSNByCode(x.SKU.hsn);
                x.SKU.HSNCode = HSN?.hsnCode;
                x.SKU.HSN = HSN?._id;
                x.SKU.igst = HSN?.igstRate;
                x.SKU.cgst = HSN?.cgstRate;
                x.SKU.sgst = HSN?.sgstRate;
                x.SKU.ugst = HSN?.ugstRate;
                array.push(x);
            }
            existing.CNDetails = array;
        }
        let hsnArr = [...new Set(existing?.CNDetails?.map(x => x.hsn))];
        existing.GSTDetails = [];
        let condition = existing.customer?.GSTIN?.substring(0, 2) != existing.company?.GSTIN?.substring(0, 2);
        for (let i = 0; i < hsnArr.length; i++) {
            const element = hsnArr[i];
            let arr = existing?.CNDetails?.filter(m => m.hsn == element);
            let lineValue = Number(arr.map(y => +y.lineValue).reduce((a, c) => a + c, 0)).toFixed(2);
            let igstRate = 0;
            let igstAmount = 0;
            let cgstRate = 0;
            let cgstAmount = 0;
            let sgstRate = 0;
            let sgstAmount = 0;
            let ugstRate = 0;
            let ugstAmount = 0;

            if (condition) {
                igstRate = arr[0].SKU.igst;
                igstAmount = (+igstRate * +lineValue) / 100;
            } else {
                cgstRate = arr[0].SKU.cgst;
                cgstAmount = (+cgstRate * +lineValue) / 100;
                sgstRate = arr[0].SKU.sgst;
                sgstAmount = (+sgstRate * +lineValue) / 100;
            }
            existing.GSTDetails.push({
                hsn: arr[0].hsn,
                taxableValue: +lineValue,
                igstRate: igstRate,
                igstAmount: igstAmount,
                cgstRate: cgstRate,
                cgstAmount: cgstAmount,
                sgstRate: sgstRate,
                sgstAmount: sgstAmount,
                ugstRate: ugstRate,
                ugstAmount: ugstAmount,
                totalTaxableValue: Number(+lineValue + +cgstAmount + +igstAmount + +sgstAmount + +ugstAmount).toFixed(2)
            });
        }
        existing.otherCharges = 0;
        if (existing?.CNServiceDetails?.length) {
            let lineValue = +existing?.CNServiceDetails?.reduce((a, c) => a + c?.creditValue, 0);
            existing.otherCharges = lineValue;
            let igstRate = 0;
            let igstAmount = 0;
            let cgstRate = 0;
            let cgstAmount = 0;
            let sgstRate = 0;
            let sgstAmount = 0;
            let ugstRate = 0;
            let ugstAmount = 0;
            if (condition) {
                igstRate = 18;
                igstAmount = (+igstRate * +lineValue) / 100;
            } else {
                cgstRate = 9;
                sgstRate = 9;
                cgstAmount = (+cgstRate * +lineValue) / 100;
                sgstAmount = (+sgstRate * +lineValue) / 100;
            }
            existing.GSTDetails.push({
                hsn: "996511",
                taxableValue: +lineValue,
                igstRate: igstRate,
                igstAmount: igstAmount,
                cgstRate: cgstRate,
                cgstAmount: cgstAmount,
                sgstRate: sgstRate,
                sgstAmount: sgstAmount,
                ugstRate: ugstRate,
                ugstAmount: ugstAmount,
                totalTaxableValue: Number(+lineValue + +cgstAmount + +igstAmount + +sgstAmount + +ugstAmount).toFixed(2)
            });
        }
        existing.totalTaxableAmount = existing.GSTDetails.map(x => +x.taxableValue).reduce((a, c) => a + c, 0);
        existing.totalCGSTAmount = existing?.GSTDetails.map(y => +y.cgstAmount).reduce((a, c) => a + c, 0);
        existing.totalSGSTAmount = existing?.GSTDetails.map(y => +y.sgstAmount).reduce((a, c) => a + c, 0);
        existing.totalIGSTAmount = existing?.GSTDetails.map(y => +y.igstAmount).reduce((a, c) => a + c, 0);
        existing.totalUGSTAmount = existing?.GSTDetails.map(y => +y.ugstAmount).reduce((a, c) => a + c, 0);
        existing.totalTaxAmount =
            +existing.totalCGSTAmount +
            +existing.totalSGSTAmount +
            +existing.totalIGSTAmount +
            +existing.totalUGSTAmount;
        existing.totalAmountWithTax = existing?.GSTDetails.map(y => +y.totalTaxableValue).reduce((a, c) => a + c, 0);
        existing.roundedOff = 0;
        existing.roundedOff += Math.round(existing.totalAmountWithTax) - +existing.totalAmountWithTax;
        existing.totalAmountWithTax = Math.round(+existing.totalAmountWithTax);
        return existing;
    } catch (error) {
        console.error(error);
    }
}

exports.getAllCreditNote = async company => {
    const rows = await Model.aggregate([
        {
            $match: {
                company: ObjectId(company)
            }
        },
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$CNDate"}}
            }
        },
        {
            $lookup: {
                from: "Customer",
                localField: "customer",
                foreignField: "_id",
                pipeline: [{$project: {categoryType: 1}}],
                as: "customer"
            }
        },
        {
            $unwind: "$customer"
        },
        {
            $facet: {
                MTDCreditNote: [
                    {
                        $match: {
                            "customer.categoryType": SALES_CATEGORY.DOMESTIC,
                            CNStatus: {$ne: [OPTIONS.defaultStatus.AWAITING_APPROVAL, OPTIONS.defaultStatus.REJECTED]},
                            matchDate: {
                                $gte: dateToAnyFormat(getFirstDateOfMonth(), "YYYY-MM-DD"),
                                $lte: dateToAnyFormat(getLastDateOfMonth(), "YYYY-MM-DD")
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            amount: {$sum: "$netCNValue"}
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            amount: {$round: [{$divide: ["$amount", LAKH]}, 2]}
                        }
                    }
                ],
                YTDCreditNote: [
                    {
                        $match: {
                            "customer.categoryType": SALES_CATEGORY.DOMESTIC,
                            CNStatus: {$ne: [OPTIONS.defaultStatus.AWAITING_APPROVAL, OPTIONS.defaultStatus.REJECTED]},
                            matchDate: {
                                $gte: dateToAnyFormat(getFirstDayOfFiscalYear(), "YYYY-MM-DD"),
                                $lte: dateToAnyFormat(getLastDayOfFiscalYear(), "YYYY-MM-DD")
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            amount: {$sum: "$netCNValue"}
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            amount: {$round: [{$divide: ["$amount", LAKH]}, 2]}
                        }
                    }
                ]
            }
        }
    ]);
    let obj = {
        MTDCreditNote: rows[0]?.MTDCreditNote[0]?.amount || 0,
        YTDCreditNote: rows[0]?.YTDCreditNote[0]?.amount || 0
    };
    return obj;
};

exports.getAllCNSummaryReports = asyncHandler(async (req, res) => {
    const customers = await getAllCustomers(req.user.company);
    try {
        const {
            search = null,
            excel = "false",
            page = 1,
            pageSize = 10,
            column = "createdAt",
            direction = -1,
            customerId = null,
            fromDate = null,
            toDate = null,
            status = null
        } = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!customerId && {
                customer: {$eq: ObjectId(customerId)}
            }),
            ...(!!status && {
                CNStatus: {$eq: status}
            }),
            ...(!!toDate &&
                !!fromDate && {
                    CNDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = getAllCNSummaryReportsAttributes();
        let match = await getMatchData(project, search);
        let pagination = [];
        if (excel == "false") {
            pagination = [{$skip: +skip}, {$limit: +pageSize}];
        }
        let rows = await Model.aggregate([
            {
                $match: query
            },
            {
                $group: {
                    _id: "$customer",
                    totalCreditNotes: {
                        $sum: 1
                    },
                    totalAmountCredited: {
                        $sum: "$netCNValue"
                    }
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "_id",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 1, customerName: 1}}],
                    as: "customer"
                }
            },
            {$unwind: "$customer"},
            ...getAllAggregationFooter(project, match, column, direction, pagination)
        ]);
        return res.success({
            customers,
            statusOptions: OPTIONS.defaultStatus.getAllCNStatusAsArray(),
            ...outputData(rows)
        });
    } catch (e) {
        console.error("getAllCNSummaryReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllCNDetailsReports = asyncHandler(async (req, res) => {
    let customers = await getAllCustomers(req.user.company);
    try {
        const {
            search = null,
            excel = "false",
            page = 1,
            pageSize = 10,
            column = "createdAt",
            direction = -1,
            customer = null,
            fromDate = null,
            toDate = null,
            CNStatus = null
        } = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!customer && {
                customer: {$eq: ObjectId(customer)}
            }),
            ...(!!CNStatus && {
                CNStatus: CNStatus
            }),
            ...(!!toDate &&
                !!fromDate && {
                    CNDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = getAllCNDetailsReportsAttributes();
        let match = await getMatchData(project, search);
        let pagination = [];
        if (excel == "false") {
            pagination = [{$skip: +skip}, {$limit: +pageSize}];
        }
        let rows = await Model.aggregate([
            {
                $match: query
            },
            {
                $addFields: {
                    CNDateS: {$dateToString: {format: "%d-%m-%Y", date: "$CNDate"}}
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {customerName: 1}}],
                    as: "customer"
                }
            },
            {$unwind: "$customer"},
            {$unwind: "$CNDetails"},
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "CNDetails.SKU",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                SKUNo: 1,
                                SKUName: 1,
                                SKUDescription: 1
                            }
                        }
                    ],
                    as: "CNDetails.SKU"
                }
            },
            {$unwind: "$CNDetails.SKU"},
            {
                $addFields: {
                    lineValue: {$toString: "$lineValue"}
                }
            },
            ...getAllAggregationFooter(project, match, column, direction, pagination)
        ]);
        return res.success({
            customers,
            statusOptions: OPTIONS.defaultStatus.getAllCNStatusAsArray(),
            ...outputData(rows)
        });
    } catch (e) {
        console.error("getAllCNDetailsReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getTotalNoOfCreditNotePerDay = async company => {
    const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
    let rows = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$CNDate"}}
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
                totalCreditNote: {$sum: 1},
                totalCreditNoteValue: {$sum: "$netCNValue"}
            }
        },
        {
            $project: {
                _id: 0,
                totalCreditNote: 1,
                totalCreditNoteValue: {$round: [{$divide: ["$totalCreditNoteValue", LAKH]}, 2]}
            }
        }
    ]);
    rows = {
        totalCreditNote: rows[0]?.totalCreditNote || 0,
        totalCreditNoteValue: rows[0]?.totalCreditNoteValue || 0
    };
    return rows.length > 0 ? rows[0] : [];
};
