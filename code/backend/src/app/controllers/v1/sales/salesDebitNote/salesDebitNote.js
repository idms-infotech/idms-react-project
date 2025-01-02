const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/sales/salesDebitNoteModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    outputData,
    getAllAggregationFooter,
    getAllReportsAggregationFooter,
    outputDataReports
} = require("../../../../helpers/utility");
const {getMatchData} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {
    getFirstDateOfMonth,
    getLastDateOfMonth,
    getFirstDayOfFiscalYear,
    getLastDayOfFiscalYear
} = require("../../../../utilities/utility");
const {CONSTANTS} = require("../../../../../config/config");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const {getAllCustomers} = require("../customerMaster/customerMaster");
const {
    getAllSalesDebitNoteAttributes,
    getAllSalesDebitNoteReportsAttributes,
    getAllSalesDNDetailsReportsAttributes
} = require("../../../../models/sales/helpers/salesDebitNoteHelper");
const {getAllSKUListByCustomerId} = require("../SKU/SKU");
const {getSalesHSNByCode} = require("../salesHSN/salesHSN");
// const {getSalesDNMailConfig} = require("./salesDebitNoteMail");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {SALES_DEBIT_NOTE} = require("../../../../mocks/schemasConstant/salesConstant");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const MailTriggerRepository = require("../../../../models/settings/repository/mailTriggerRepository");
const {SALES_MAIL_CONST} = require("../../../../mocks/mailTriggerConstants");
const SalesDebitNoteRepository = require("../../../../models/sales/repository/salesDebitNoteRepository");
const {getAllCustomerCategory} = require("../../settings/customerCategory/customerCategory");
const ObjectId = mongoose.Types.ObjectId;

// @route   GET /purchase/Debit Note/getAll
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllSalesDebitNoteAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company), DNStatus: {$in: ["Awaiting Approval", "Approved"]}}},
            {
                $addFields: {
                    netDNValue: {$toString: "$netDNValue"},
                    DNDateS: {$dateToString: {format: "%d-%m-%Y", date: "$DNDate"}},
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
        let rows = await SalesDebitNoteRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllSalesDN", e);
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
        const itemDetails = await SalesDebitNoteRepository.createDoc(createdObj);
        // await updateRejectQtyModel(itemDetails, "created");
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Sales Debit Note")
            });
            // let mailCreateObj = {
            //     DNId: itemDetails._id,
            //     action: "created",
            //     company: req.user.company,
            //     mailAction: "Create"
            // };
            // getSalesDNMailConfig(mailCreateObj);
            let mailTriggerCreateObj = {
                subModuleId: itemDetails._id,
                action: "created",
                company: req.user.company,
                mailAction: "Create",
                collectionName: SALES_DEBIT_NOTE.COLLECTION_NAME,
                message: `Debit Note Created - ${itemDetails.DNNumber}`,
                module: SALES_MAIL_CONST.DEBIT_NOTE.MODULE,
                subModule: SALES_MAIL_CONST.DEBIT_NOTE.SUB_MODULE,
                isSent: false
            };
            await MailTriggerRepository.createDoc(mailTriggerCreateObj);
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Sales Debit note", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await SalesDebitNoteRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await SalesDebitNoteRepository.updateDoc(itemDetails, req.body);
        // if (itemDetails.DNStatus == "Rejected" || itemDetails.DNStatus == "Awaiting Approval") {
        // await updateRejectQtyModel(itemDetails, "updated");
        // }
        if (itemDetails) {
            res.success({
                message: `Sales Debit Note has been ${
                    itemDetails.DNStatus == "Awaiting Approval" ? "updated" : itemDetails.DNStatus.toLowerCase()
                } successfully`
            });
            // let mailUpdateObj = {
            //     DNId: itemDetails._id,
            //     action: "modified",
            //     company: req.user.company,
            //     mailAction: itemDetails.DNStatus
            // };
            // getSalesDNMailConfig(mailUpdateObj);
            if (["Awaiting Approval", "Report Generated"].includes(itemDetails.DNStatus)) {
                let actions = {
                    "Awaiting Approval": "Modified",
                    "Report Generated": "Report Generated"
                };
                let mailTriggerCreateObj = {
                    subModuleId: itemDetails._id,
                    action: actions[itemDetails.DNStatus],
                    company: req.user.company,
                    mailAction: actions[itemDetails.DNStatus],
                    collectionName: SALES_DEBIT_NOTE.COLLECTION_NAME,
                    message: `Debit Note ${actions[itemDetails.DNStatus]} - ${itemDetails.DNNumber}`,
                    module: SALES_MAIL_CONST.DEBIT_NOTE.MODULE,
                    subModule: SALES_MAIL_CONST.DEBIT_NOTE.SUB_MODULE,
                    isSent: false
                };
                await MailTriggerRepository.createDoc(mailTriggerCreateObj);
            }
        }
    } catch (e) {
        console.error("update Sales Debit Note", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await SalesDebitNoteRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Sales Debit Note")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Sales Debit Note");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Sales Debit Note", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id)
            .populate(
                "customer",
                "GSTIN customerCode customerBillingAddress customerShippingAddress customerContactInfo"
            )
            .populate({
                path: "company",
                model: "Company",
                select: {
                    companyName: 1,
                    GSTIN: 1,
                    companyBillingAddress: 1,
                    contactInfo: 1,
                    swiftCode: 1,
                    companyBankMICRCode: 1,
                    intermediaryBank: 1,
                    companyBefName: 1,
                    companyBankName: 1,
                    companyAccountNumber: 1,
                    companyBankIFSCCode: 1,
                    companyBankBranch: 1,
                    intermediaryBankSwiftCode: 1,
                    companySignatureUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$companySignature"]},
                    companyPdfHeaderUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$companyPdfHeader"]}
                }
            })
            .populate("DNDetails.SKU", "_id SKUNo SKUName SKUDescription")
            .lean();
        existing = await getDataPDF(existing);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Debit Note");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Debit Note", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getDNDetailsById = asyncHandler(async (req, res) => {
    try {
        let existing = await SalesDebitNoteRepository.filteredSalesDebitNoteList([
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
                                GSTIN: 1,
                                customerCode: 1,
                                customerBillingAddress: 1,
                                customerShippingAddress: 1,
                                customerContactInfo: 1
                            }
                        }
                    ],

                    as: "customer"
                }
            },
            {
                $unwind: "$customer"
            },
            {
                $lookup: {
                    from: "Company",
                    localField: "company",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                companyName: 1,
                                GSTIN: 1,
                                companyBillingAddress: 1,
                                contactInfo: 1,
                                swiftCode: 1,
                                companyBankMICRCode: 1,
                                intermediaryBank: 1,
                                companyBefName: 1,
                                companyBankName: 1,
                                companyAccountNumber: 1,
                                companyBankIFSCCode: 1,
                                companyBankBranch: 1,
                                intermediaryBankSwiftCode: 1,
                                companySignatureUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$companySignature"]},
                                companyPdfHeaderUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$companyPdfHeader"]}
                            }
                        }
                    ],
                    as: "company"
                }
            },
            {$unwind: "$company"},
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "DNDetails.SKU",
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
                    as: "SKUInfo"
                }
            },
            {
                $addFields: {
                    DNDetails: {
                        $map: {
                            input: "$DNDetails",
                            as: "detail",
                            in: {
                                $mergeObjects: [
                                    "$$detail",
                                    {
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
                                ]
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    company: 1,
                    DNNumber: 1,
                    DNDate: 1,
                    salesCategory: 1,
                    customer: 1,
                    customerName: 1,
                    invoiceNo: 1,
                    invoiceDate: 1,
                    currency: 1,
                    DNDetails: 1,
                    reasonForDN: 1,
                    remarks: 1,
                    netDNValue: 1,
                    otherCharges: 1,
                    DNStatus: 1,
                    GSTDetails: 1,
                    totalCGSTAmount: 1,
                    totalSGSTAmount: 1,
                    totalIGSTAmount: 1,
                    totalUGSTAmount: 1,
                    totalTaxAmount: 1,
                    totalAmount: 1,
                    totalAmountWithTax: 1,
                    roundedOff: 1
                }
            }
        ]);
        if (!existing.length) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Debit Note");
            return res.unprocessableEntity(errors);
        } else {
            existing = await getDataPDF(existing[0]);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getDNDetailsById Debit Note", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...SALES_DEBIT_NOTE.AUTO_INCREMENT_DATA()},
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
                    customerCode: 1,
                    customerBillingState: "$customerBillingAddress.state",
                    customerBillingCity: "$customerBillingAddress.city",
                    customerBillingPinCode: "$customerBillingAddress.pinCode",
                    customerCategory: "$customerCategory",
                    customerCurrency: "$customerCurrency"
                }
            }
        ]);
        let salesCategory = await getAllCustomerCategory(req.user.company);
        return res.success({
            autoIncrementNo,
            customersOptions,
            salesCategoryOptions: salesCategory.map(x => {
                return {
                    category: x?.category,
                    categoryType: x?.categoryType
                };
            })
        });
    } catch (error) {
        console.error("getAllMasterData Sales Debit Note", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllSalesDebitNoteByCustomerId = asyncHandler(async (req, res) => {
    try {
        let SKUList = await getAllSKUListByCustomerId(req.params.id, {
            SKU: "$_id",
            SKUNo: 1,
            SKUName: 1,
            UOM: "$primaryUnit",
            SKUDescription: 1,
            purchaseRate: "$customerInfo.standardSellingRate",
            lineValue: 1,
            standardRate: "$customerInfo.standardSellingRate",
            customer: "$customerInfo.customer",
            customerName: "$customerInfo.customerName",
            hsn: "$hsn",
            gst: "$gst",
            igst: "$igst",
            cgst: "$cgst",
            sgst: "$sgst",
            ugst: "$ugst",
            primaryUnit: "$primaryUnit",
            returnQty: 1
        });

        return res.success(SKUList);
    } catch (e) {
        console.error("getById Sales Debit Note", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllReports = asyncHandler(async (req, res) => {
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
            toDate = null
        } = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let query = {
            company: ObjectId(req.user.company),
            DNStatus: {$in: ["Report Generated"]},
            ...(!!customer && {
                customer: {$eq: ObjectId(customer)}
            }),
            ...(!!toDate &&
                !!fromDate && {
                    DNDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = getAllSalesDebitNoteReportsAttributes();
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
                    DNDateS: {$dateToString: {format: "%d-%m-%Y", date: "$DNDate"}},
                    invoiceDateS: {$dateToString: {format: "%d-%m-%Y", date: "$invoiceDate"}}
                }
            },
            // {
            //     $lookup: {
            //         from: "Customer",
            //         localField: "customers",
            //         foreignField: "_id",
            //         pipeline: [{$project: {customersName: 1}}],
            //         as: "customers"
            //     }
            // },
            // {$unwind: "$customers"},
            ...getAllReportsAggregationFooter(project, match, column, direction, pagination, [
                {
                    $group: {
                        _id: null,
                        netDNValue: {$sum: {$toDouble: "$netDNValue"}}
                    }
                },
                {
                    $project: {
                        netDNValue: {$round: ["$netDNValue", 2]},
                        _id: 0
                    }
                }
            ])
        ]);
        return res.success({
            customers,
            ...outputDataReports(rows)
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getYTDNetDebitNote = asyncHandler(async company => {
    const result = await Model.aggregate([
        {
            $match: {
                company: ObjectId(company),
                DNStatus: {$nin: ["Awaiting Approval", "Rejected"]},
                DNDate: {
                    $gte: getFirstDayOfFiscalYear(),
                    $lte: getLastDayOfFiscalYear()
                }
            }
        },
        {
            $group: {
                _id: "$purchaseCategory",
                amount: {$sum: "$netDNValue"}
            }
        }
    ]);
    if (result.length > 0) {
        return result;
    } else {
        return [];
    }
});
exports.getMTDNetDebitNote = asyncHandler(async company => {
    const result = await Model.aggregate([
        {
            $match: {
                company: ObjectId(company),
                DNStatus: {$nin: ["Awaiting Approval", "Rejected"]},
                DNDate: {$gte: getFirstDateOfMonth(), $lte: getLastDateOfMonth()}
            }
        },
        {
            $group: {
                _id: "$purchaseCategory",
                amount: {$sum: "$netDNValue"}
            }
        }
    ]);
    if (result.length > 0) {
        return result;
    } else {
        return [];
    }
});
async function getDataPDF(existing) {
    try {
        if (existing.customer.customerContactInfo.length) {
            existing.customer.customerContactInfo = existing.customer.customerContactInfo[0];
        }
        if (existing.customer.customerBillingAddress.length) {
            existing.customer.customerBillingAddress = existing.customer.customerBillingAddress[0];
        }
        if (existing.customer.customerShippingAddress.length) {
            existing.customer.customerShippingAddress = existing.customer.customerShippingAddress[0];
        }
        if (existing.DNDetails.length) {
            let array = [];
            for await (const x of existing?.DNDetails) {
                let HSN = await getSalesHSNByCode(x.hsn);
                x.hsn = HSN?.hsnCode;
                x.igst = HSN?.igstRate;
                x.cgst = HSN?.cgstRate;
                x.sgst = HSN?.sgstRate;
                x.ugst = HSN?.ugstRate;
                array.push(x);
            }
            existing.DNDetails = array;
        }
        let hsnArr = [...new Set(existing?.DNDetails?.map(x => x.hsn))];
        existing.GSTDetails = [];
        let condition = existing.customer?.GSTIN.substring(0, 2) != existing.company.GSTIN.substring(0, 2);
        for (let i = 0; i < hsnArr.length; i++) {
            const element = hsnArr[i];
            let arr = existing?.DNDetails?.filter(m => m.hsn == element);
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
                igstRate = arr[0].igst;
                igstAmount = (+igstRate * +lineValue) / 100;
            } else {
                cgstRate = arr[0].cgst;
                cgstAmount = (+cgstRate * +lineValue) / 100;
                sgstRate = arr[0].sgst;
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
        if (existing.otherCharges && existing.otherCharges.totalAmount) {
            let lineValue = +existing?.otherCharges?.totalAmount;
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

        existing.totalCGSTAmount = existing?.GSTDetails.map(y => +y.cgstAmount).reduce((a, c) => a + c, 0);
        existing.totalSGSTAmount = existing?.GSTDetails.map(y => +y.sgstAmount).reduce((a, c) => a + c, 0);
        existing.totalIGSTAmount = existing?.GSTDetails.map(y => +y.igstAmount).reduce((a, c) => a + c, 0);
        existing.totalUGSTAmount = existing?.GSTDetails.map(y => +y.ugstAmount).reduce((a, c) => a + c, 0);
        existing.totalTaxAmount =
            +existing.totalCGSTAmount +
            +existing.totalSGSTAmount +
            +existing.totalIGSTAmount +
            +existing.totalUGSTAmount;

        existing.totalAmount = existing?.GSTDetails.map(y => +y.taxableValue).reduce((a, c) => a + c, 0);
        existing.totalAmountWithTax = existing?.GSTDetails.map(y => +y.totalTaxableValue).reduce((a, c) => a + c, 0);
        existing.roundedOff = 0;
        existing.roundedOff += Math.round(existing.totalAmountWithTax) - +existing.totalAmountWithTax;
        existing.totalAmountWithTax = Math.round(+existing.totalAmountWithTax);
        return existing;
    } catch (error) {
        console.error(error);
    }
}
exports.getAllSalesDNSummaryReports = asyncHandler(async (req, res) => {
    const customers = await getAllCustomers(req.user.company);
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
            DNStatus = null
        } = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!customer && {
                customer: {$eq: ObjectId(customer)}
            }),
            ...(!!DNStatus && {
                DNStatus: {$eq: DNStatus}
            }),
            ...(!!toDate &&
                !!fromDate && {
                    DNDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };

        let project = {
            customerName: "$customer.customerName",
            totalDebitNotes: 1,
            totalAmountDebited: 1,
            DNStatus: 1
        };
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
                    totalDebitNotes: {
                        $sum: 1
                    },
                    totalAmountDebited: {
                        $sum: "$netDNValue"
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
        let totalAmount = await Model.aggregate([
            {$match: query},
            {
                $group: {
                    _id: null,
                    totalAmountDebited: {$sum: "$netDNValue"}
                }
            },
            {
                $project: {
                    totalAmountDebited: 1,
                    _id: 0
                }
            }
        ]);
        return res.success({
            customers,
            statusOptions: ["Awaiting Approval", "Approved", "Rejected", "Report Generated", "Closed"],
            totalAmount,
            ...outputData(rows)
        });
    } catch (e) {
        console.error("getAllDNSummaryReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllSalesDNDetailsReports = asyncHandler(async (req, res) => {
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
            DNStatus = null
        } = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!customer && {
                customer: {$eq: ObjectId(customer)}
            }),
            ...(!!DNStatus && {
                DNStatus: {$eq: DNStatus}
            }),
            ...(!!toDate &&
                !!fromDate && {
                    DNDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = getAllSalesDNDetailsReportsAttributes();
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
                    DNDateS: {$dateToString: {format: "%d-%m-%Y", date: "$DNDate"}}
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
            {$unwind: "$DNDetails"},
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "DNDetails.SKU",
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
                    as: "DNDetails.SKU"
                }
            },
            {$unwind: "$DNDetails.SKU"},
            {
                $addFields: {
                    lineValue: {$toString: "$lineValue"}
                }
            },
            ...getAllAggregationFooter(project, match, column, direction, pagination)
        ]);
        let totalAmount = await Model.aggregate([
            {$match: query},
            {$unwind: "$DNDetails"},
            {
                $group: {
                    _id: null,
                    totalDNValue: {$sum: "$DNDetails.lineValue"}
                }
            },
            {
                $project: {
                    totalDNValue: 1,
                    _id: 0
                }
            }
        ]);
        return res.success({
            customers,
            totalAmount,
            statusOptions: ["Awaiting Approval", "Approved", "Rejected", "Report Generated", "Closed"],
            ...outputData(rows)
        });
    } catch (e) {
        console.error("getAllDNDetailsReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
