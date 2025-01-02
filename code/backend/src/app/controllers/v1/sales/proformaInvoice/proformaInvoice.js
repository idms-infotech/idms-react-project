const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/sales/proformaInvoiceModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {getAllCustomers} = require("../customerMaster/customerMaster");
const {createSO, getCustomerDiscount} = require("../salesOrder/salesOrder");
const {getFirstDayOfFiscalYear, getLastDayOfFiscalYear} = require("../../../../utilities/utility");
const {getSalesHSNByCode} = require("../salesHSN/salesHSN");
const {CONSTANTS} = require("../../../../../config/config");
const {getSubtractedDate, getEndDateTime, getStartDateTime, dateToAnyFormat} = require("../../../../helpers/dateTime");
const {getCompanyLocations, getCompanyById} = require("../../settings/company/company");
const {
    getAllProformaInvoiceAttributes,
    getAllProformaInvoiceExcelAttributes,
    getAllProformaInvoiceReportsAttributes
} = require("../../../../models/sales/helpers/proformaInvoiceHelper");
// const {getPIMailConfig} = require("./proformaInvoiceMail");
const {PROFORMA_INVOICE} = require("../../../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const PIRepository = require("../../../../models/sales/repository/proformaInvoiceRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {getAllTransporter} = require("../transporter/transporter");
const ObjectId = mongoose.Types.ObjectId;
const MailTriggerRepository = require("../../../../models/settings/repository/mailTriggerRepository");
const {SALES_MAIL_CONST} = require("../../../../mocks/mailTriggerConstants");
const {checkDomesticCustomer} = require("../../../../helpers/utility");
const {filteredSKUMasterList} = require("../../../../models/sales/repository/SKUMasterRepository");
const {GST_CLASSIFICATION} = require("../../../../mocks/constantData");
const {getAllCustomerCategory} = require("../../settings/customerCategory/customerCategory");
const {filteredLogisticsProviderList} = require("../../../../models/planning/repository/logisticsProviderRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllProformaInvoiceAttributes();
        if (req.query.excel == "true") {
            project = getAllProformaInvoiceExcelAttributes();
        }
        let pipeline = [
            {$match: {company: ObjectId(req.user.company)}},
            {
                $match: {
                    PIStatus: {$in: ["Created", "Approved"]}
                }
            },
            {
                $addFields: {
                    PITotalAmount: {$toString: "$PITotalAmount"},
                    PIDateS: {$dateToString: {format: "%d-%m-%Y", date: "$PIDate"}}
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            {$unwind: "$customer"}
        ];
        let rows = await PIRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllProforma Invoice", e);
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
        const itemDetails = await PIRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Proforma Invoice")
            });
            // let mailCreateObj = {
            //     PIId: itemDetails._id,
            //     action: "created",
            //     company: req.user.company,
            //     mailAction: "Create"
            // };
            // getPIMailConfig(mailCreateObj);
            let mailTriggerCreateObj = {
                subModuleId: itemDetails._id,
                action: "created",
                company: req.user.company,
                mailAction: "Create",
                collectionName: PROFORMA_INVOICE.COLLECTION_NAME,
                message: `Proforma Invoice Created - ${itemDetails.PINumber}`,
                module: SALES_MAIL_CONST.PROFORMA_INV.MODULE,
                subModule: SALES_MAIL_CONST.PROFORMA_INV.SUB_MODULE,
                isSent: false
            };
            await MailTriggerRepository.createDoc(mailTriggerCreateObj);
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Proforma Invoice", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    update SO  Record
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await PIRepository.getDocById(req.params.id);

        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await PIRepository.updateDoc(itemDetails, req.body);
        let output = {
            message: MESSAGES.apiSuccessStrings.UPDATE("Proforma Invoice has been")
        };
        if (itemDetails.PIStatus == "Converted to SO") {
            let newSO = await createSO(itemDetails);
            output = {
                message: `# ${newSO.SONumber} has been converted successfully`,
                ...newSO
            };
        } else {
            output = {
                message: `PI has been ${
                    itemDetails.PIStatus == "Created" ? "updated" : itemDetails.PIStatus.toLowerCase()
                } successfully`
            };
        }
        if (itemDetails) {
            res.success(output);
            // let mailUpdateObj = {
            //     PIId: itemDetails._id,
            //     action: "modified",
            //     company: req.user.company,
            //     mailAction: "Converted to SO",
            //     SOnumber: output.SONumber
            // };
            // getPIMailConfig(mailUpdateObj);
            if (["Converted to SO"].includes(itemDetails.PIStatus)) {
                let mailTriggerCreateObj = {
                    subModuleId: itemDetails._id,
                    action: "modified",
                    company: req.user.company,
                    mailAction: "Converted to SO",
                    collectionName: PROFORMA_INVOICE.COLLECTION_NAME,
                    message: `Proforma Invoice Converted to SO - ${itemDetails.PINumber}`,
                    module: SALES_MAIL_CONST.PROFORMA_INV.MODULE,
                    subModule: SALES_MAIL_CONST.PROFORMA_INV.SUB_MODULE,
                    isSent: false
                };
                await MailTriggerRepository.createDoc(mailTriggerCreateObj);
            }
        }
    } catch (e) {
        console.error("update Proforma Invoice", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("Proforma Invoice")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Proforma Invoice");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Proforma Invoice", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id)
            .populate(
                "customer",
                "customerCurrency customerName customerPaymentTerms customerCategory customerBillingAddress customerShippingAddress customerContactInfo GSTIN"
            )
            .populate("PIDetails.SKU");
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Advance Shipment Notice");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Advance Shipment Notice", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getProInvDetailsById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id)
            .populate(
                "customer",
                "customerCurrency customerName customerPaymentTerms customerCategory GSTClassification customerBillingAddress customerShippingAddress customerContactInfo GSTIN customerPAN eximCode showEximCode showPANNo categoryType"
            )
            .populate({
                path: "company",
                model: "Company",
                select: {
                    companyName: 1,
                    GSTIN: 1,
                    placesOfBusiness: 1,
                    companyBankName: 1,
                    companyBefName: 1,
                    companyBankIFSCCode: 1,
                    companyBankBranch: 1,
                    companyAccountNumber: 1,
                    intermediaryBankSwiftCode: 1,
                    swiftCode: 1,
                    companyBankMICRCode: 1,
                    companyBankIFSCCode: 1,
                    companyBankAddress: 1,
                    companyBankBranch: 1,
                    intermediaryBank: 1,
                    intermediaryBankSwiftCode: 1,
                    PIDomesticTemplates: 1,
                    PIExportsTemplates: 1,
                    logoUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$logo"]},
                    companySignatureUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$companySignature"]},
                    companyPdfHeaderUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$companyPdfHeader"]},
                    SOSignatureUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$SOSignature"]},
                    SOPdfHeaderUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$SOPdfHeader"]}
                }
            })
            .populate("PIDetails.SKU")
            .lean();
        if (existing?.customer?.customerShippingAddress?.length) {
            existing.customer.customerShippingAddress = existing.customer.customerShippingAddress[0];
        }
        if (existing?.customer?.customerBillingAddress?.length) {
            existing.customer.customerBillingAddress = existing.customer.customerBillingAddress[0];
        }

        if (existing?.customer?.customerContactInfo?.length) {
            existing.customer.customerContactInfo = existing.customer.customerContactInfo[0];
        }
        if (existing?.company?.placesOfBusiness?.length > 0) {
            for (const e of existing.company.placesOfBusiness) {
                if (e.locationID == existing.billFromLocation && e.SOPdfHeader) {
                    existing.company.SOPdfHeaderUrl = `${CONSTANTS.domainUrl}company/` + e.SOPdfHeader;
                }
                if (e.locationID == existing.billFromLocation && e.SOSignature) {
                    existing.company.SOSignatureUrl = `${CONSTANTS.domainUrl}company/` + e.SOSignature;
                }
                if (e.locationID == existing.billFromLocation && e.PISignature) {
                    existing.company.PISignatureUrl = `${CONSTANTS.domainUrl}company/` + e.PISignature;
                }
            }
        }
        if (existing?.PIDetails?.length) {
            let arr = [];
            for await (const x of existing?.PIDetails) {
                let HSN = await getSalesHSNByCode(x?.SKU?.hsn);
                x.SKU.HSNCode = HSN?.hsnCode;
                x.SKU.HSN = HSN?._id;
                x.SKU.igst = HSN?.igstRate;
                x.SKU.cgst = HSN?.cgstRate;
                x.SKU.sgst = HSN?.sgstRate;
                x.SKU.ugst = HSN?.ugstRate;
                arr.push(x);
            }
            existing.PIDetails = arr;
        }
        let customerCategoryCondition = await checkDomesticCustomer(existing.customer.categoryType);
        let condition = false;
        if (existing?.company?.placesOfBusiness?.length > 0 && customerCategoryCondition) {
            for (const ele of existing?.company?.placesOfBusiness) {
                if (existing?.billFromLocation == ele?.locationID) {
                    if (existing?.customer?.GSTClassification == GST_CLASSIFICATION.UNREGISTER_DEALER) {
                        condition =
                            existing?.customer?.customerBillingAddress?.state?.trim()?.toLowerCase() !=
                            ele?.state?.trim()?.toLowerCase();
                    } else {
                        condition =
                            existing?.customer?.GSTIN.substring(0, 2) != ele.GSTINForAdditionalPlace.substring(0, 2);
                    }
                }
            }
        }
        existing.totalTaxableAmount = existing.PIDetails.map(x => +x.lineValue).reduce((a, c) => a + c, 0);
        let hsnArr = [...new Set(existing?.PIDetails.map(x => x.HSNCode))];
        existing.GSTDetails = [];
        for (let i = 0; i < hsnArr.length; i++) {
            const element = hsnArr[i];
            let arr = existing?.PIDetails.filter(m => m.HSNCode == element);
            let lineValue = Number(arr.map(y => +y.lineValue).reduce((a, c) => a + c, 0)).toFixed(2);
            let igstRate = 0;
            let igstAmount = 0;
            let cgstRate = 0;
            let cgstAmount = 0;
            let sgstRate = 0;
            let sgstAmount = 0;
            let ugstRate = 0;
            let ugstAmount = 0;
            if (customerCategoryCondition) {
                if (condition) {
                    igstRate = arr[0].SKU.igst;
                    igstAmount = (+igstRate * +lineValue) / 100;
                } else {
                    cgstRate = arr[0].SKU.cgst;
                    cgstAmount = (+cgstRate * +lineValue) / 100;
                    sgstRate = arr[0].SKU.sgst;
                    sgstAmount = (+sgstRate * +lineValue) / 100;
                }
            }
            existing.GSTDetails.push({
                HSNCode: arr[0].SKU.HSNCode,
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
        if (existing?.otherCharges?.totalAmount) {
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
                HSNCode: "996511",
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
        existing.PITotalCGSTAmount = existing?.GSTDetails.map(y => +y.cgstAmount).reduce((a, c) => a + c, 0);
        existing.PITotalSGSTAmount = existing?.GSTDetails.map(y => +y.sgstAmount).reduce((a, c) => a + c, 0);
        existing.PITotalIGSTAmount = existing?.GSTDetails.map(y => +y.igstAmount).reduce((a, c) => a + c, 0);
        existing.PITotalUGSTAmount = existing?.GSTDetails.map(y => +y.ugstAmount).reduce((a, c) => a + c, 0);
        existing.PITotalAmount = existing?.GSTDetails.map(y => +y.taxableValue).reduce((a, c) => a + c, 0);
        existing.PITotalTaxAmount =
            +existing.PITotalCGSTAmount +
            +existing.PITotalSGSTAmount +
            +existing.PITotalIGSTAmount +
            +existing.PITotalUGSTAmount;
        existing.PITotalAmountWithTax = +existing?.PITotalAmount + +existing?.PITotalTaxAmount;
        // if (existing.otherCharges && existing.otherCharges.totalAmount && customerCategoryCondition) {
        //     existing.PITotalAmount = +existing.PITotalAmount + +existing.otherCharges.totalAmount;
        //     existing.PITotalAmountWithTax = +existing.PITotalAmountWithTax + +existing.otherCharges.totalAmount;
        // }
        existing.roundedOff = 0;
        existing.roundedOff += Math.round(existing.PITotalAmountWithTax) - +existing.PITotalAmountWithTax;
        existing.PITotalAmountWithTax = Math.round(existing.PITotalAmountWithTax);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Proforma Invoice");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Proforma Invoice", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...PROFORMA_INVOICE.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        let salesCategory = await getAllCustomerCategory(req.user.company);
        const transporterOptions = await getAllTransporter(
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
        let modeOfTransportOptions = await getAllModuleMaster(req.user.company, "MODE_OF_TRANSPORT");
        let companyData = await getCompanyById(req.user.company, {placesOfBusiness: 1});
        const billFromLocationOptions = await getCompanyLocations(req.user.company);
        return res.success({
            autoIncrementNo,
            companyData,
            billFromLocationOptions: billFromLocationOptions?.split(",")?.map(x => {
                return {
                    label: x,
                    value: x
                };
            }),
            salesCategoryOptions: salesCategory.map(x => {
                return {
                    category: x?.category,
                    categoryType: x?.categoryType
                };
            }),
            transporterOptions: [...logisticOptions, ...transporterOptions],
            freightTermsOptions,
            modeOfTransportOptions
        });
    } catch (error) {
        console.error("getAllMasterData Proforma Invoice", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const {customer = null, fromDate = null, toDate = null} = req.query;
        let project = getAllProformaInvoiceReportsAttributes();
        let query = {
            company: ObjectId(req.user.company),
            PIStatus: {$nin: ["Created", "Rejected"]},
            ...(!!customer && {
                customer: {$eq: ObjectId(customer)}
            }),
            ...(!!toDate &&
                !!fromDate && {
                    PIDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let customers = await getAllCustomers(req.user.company, {customerName: 1});
        let pipeline = [
            {$match: query},
            {
                $addFields: {
                    PIDateS: {$dateToString: {format: "%d-%m-%Y", date: "$PIDate"}}
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
        let rows = await PIRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        PITotalAmount: {$sum: "$PITotalAmount"}
                    }
                },
                {
                    $project: {
                        PITotalAmount: 1,
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
        console.error("getAll Proforma Invoice", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getValidityData = asyncHandler(async () => {
    try {
        await Model.updateMany(
            {
                PIStatus: OPTIONS.defaultStatus.APPROVED,
                PIValidityDate: {$lt: new Date(getSubtractedDate(7, "d"))}
            },
            {
                $set: {
                    PIStatus: OPTIONS.defaultStatus.AUTO_CLOSED
                }
            },
            {new: true, useFindAndModify: false}
        );
    } catch (e) {
        console.error("getAllProforma Invoice", e);
    }
});
exports.getAllPICount = async company => {
    try {
        const count = await Model.countDocuments({
            PIStatus: {$nin: ["Created", "Rejected"]},
            company: company
        });
        return count;
    } catch (error) {
        console.error(error);
    }
};
exports.getPIConversionRate = async company => {
    const rows = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$PIDate"}}
            }
        },
        {
            $match: {
                company: ObjectId(company),
                PIStatus: {$nin: ["Created", "Rejected"]},
                matchDate: {
                    $gte: dateToAnyFormat(getFirstDayOfFiscalYear(), "YYYY-MM-DD"),
                    $lte: dateToAnyFormat(getLastDayOfFiscalYear(), "YYYY-MM-DD")
                }
            }
        },
        {
            $group: {
                _id: null,
                createdCount: {$sum: 1},
                convertedToSOcount: {$sum: {$cond: [{$eq: ["$PIStatus", "Converted to SO"]}, 1, 0]}}
            }
        },
        {
            $project: {
                conversionRate: {$round: [{$multiply: [{$divide: ["$convertedToSOcount", "$createdCount"]}, 100]}, 2]}
            }
        }
    ]);
    return rows[0]?.conversionRate || 0;
};

exports.getCustomerByCategory = asyncHandler(async (req, res) => {
    try {
        let customerOptions = await filteredCustomerList([
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
                    customerName: 1,
                    customerCode: 1,
                    customerBillingState: "$customerBillingAddress.state",
                    customerBillingCity: "$customerBillingAddress.city",
                    customerBillingPinCode: "$customerBillingAddress.pinCode",
                    customerCategory: 1,
                    customerPaymentTerms: 1,
                    customerCurrency: 1,
                    customerShippingAddress: 1
                }
            }
        ]);
        return res.success(customerOptions);
    } catch (e) {
        console.error("getCustomerById Proforma Inv", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getSKUListByCustomer = asyncHandler(async (req, res) => {
    try {
        let SKUList = await filteredSKUMasterList([
            {$match: {company: ObjectId(req.user.company), isActive: "A"}},
            {
                $unwind: "$customerInfo"
            },
            {
                $match: {
                    "customerInfo.customer": ObjectId(req.query.customer)
                }
            },
            {$sort: {createdAt: -1}},
            {
                $project: {
                    SKU: "$_id",
                    PILineNumber: {$literal: 0},
                    SKUNo: "$SKUNo",
                    SKUName: "$SKUName",
                    UOM: "$primaryUnit",
                    SKUDescription: "$SKUDescription",
                    customerPartNo: "$customerInfo.customerPartNo",
                    SOLineTargetDate: {$literal: null},
                    discount: {$literal: 0},
                    netRate: "$customerInfo.standardSellingRate",
                    orderedQty: {$literal: 0},
                    invoicedQty: {$literal: 0},
                    canceledQty: {$literal: 0},
                    balancedQty: {$literal: 0},
                    canceledReason: {$literal: null},
                    standardRate: "$customerInfo.standardSellingRate",
                    rateType: "$customerInfo.rateType",
                    sellingRateCommon: "$customerInfo.sellingRateCommon",
                    lineValue: {$literal: 0},
                    customer: "$customerInfo.customer",
                    primaryUnit: 1,
                    secondaryUnit: 1
                }
            }
        ]);
        SKUList = await getCustomerDiscount(SKUList, req.user.company);
        return res.success(SKUList);
    } catch (e) {
        console.error("getSKUListByCustomer Proforma Inv", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
