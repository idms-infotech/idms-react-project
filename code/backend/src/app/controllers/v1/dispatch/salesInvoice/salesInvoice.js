const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/dispatch/salesInvoiceModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {checkDomesticCustomer} = require("../../../../helpers/utility");
const {OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {CONSTANTS} = require("../../../../../config/config");
const {
    getAllShipmentPlannings,
    getShipmentPlanningById,
    updateShippingStatusOnTaxInvoiceGenerate
} = require("../shipmentPlanning/shipmentPlanning");
const {getB2BCustomerById, getAllCustomers} = require("../../sales/customerMaster/customerMaster");
const {getCompanyById, getCompanyLocationsWithGST} = require("../../settings/company/company");
const {getSubtractedDate, getEndDateTime, getStartDateTime, dateToAnyFormat} = require("../../../../helpers/dateTime");
const {getSalesHSNByCode} = require("../../sales/salesHSN/salesHSN");
const {SALES_CATEGORY, BOOLEAN_VALUES, GST_CLASSIFICATION} = require("../../../../mocks/constantData");
// const {getSIMailConfig} = require("./salesInvoiceMail");
const {
    getAllSalesInvoiceAttributes,
    getAllSILineDetailsAttributes
} = require("../../../../models/dispatch/helpers/salesInvoiceHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {SALES_INVOICE} = require("../../../../mocks/schemasConstant/dispatchConstant");
const SalesInvoiceRepository = require("../../../../models/dispatch/repository/salesInvoiceRepository");
const ObjectId = mongoose.Types.ObjectId;
const MailTriggerRepository = require("../../../../models/settings/repository/mailTriggerRepository");
const {DISPATCH_MAIL_CONST} = require("../../../../mocks/mailTriggerConstants");
const AutoIncrementRepository = require("../../../../models/settings/repository/autoIncrementRepository");
const TransporterRepository = require("../../../../models/sales/repository/transporterMasterRepository");
const {salesUOMPipe} = require("../../settings/SalesUOMUnitMaster/SalesUOMUnitMaster");
const {filteredSubModuleManagementList} = require("../../../../models/settings/repository/subModuleRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllSalesInvoiceAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    salesInvoiceStatus: {$nin: ["Closed", "Report Generated"]}
                }
            },
            {
                $addFields: {
                    salesInvoiceDateS: {$dateToString: {format: "%d-%m-%Y", date: "$salesInvoiceDate"}}
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
        let rows = await SalesInvoiceRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.create = asyncHandler(async (req, res) => {
    try {
        let createdObj = await getDataPDF(req);
        createdObj.salesInvoiceDetails = createdObj.salesInvoiceDetails.map(ele => {
            ele.SKU = ele.SKU._id;
            return ele;
        });
        const itemDetails = await SalesInvoiceRepository.createDoc(createdObj);
        if (itemDetails) {
            await updateShippingStatusOnTaxInvoiceGenerate(itemDetails?.shipmentPlanningId);
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("SalesInvoice")
            });
            // await getSIMailConfig(itemDetails._id, req.user.company);
            let mailTriggerCreateObj = {
                subModuleId: itemDetails._id,
                action: "Generate",
                company: req.user.company,
                mailAction: "Generate",
                collectionName: SALES_INVOICE.COLLECTION_NAME,
                message: `Tax Invoice Generation - ${itemDetails.salesInvoiceNumber}`,
                module: DISPATCH_MAIL_CONST.TAX_INV.MODULE,
                subModule: DISPATCH_MAIL_CONST.TAX_INV.SUB_MODULE,
                isSent: false
            };
            await MailTriggerRepository.createDoc(mailTriggerCreateObj);
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create SalesInvoice", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await SalesInvoiceRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("SalesInvoice")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("SalesInvoice");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById SalesInvoice", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id)
            .populate({
                path: "company",
                model: "Company",
                select: {
                    companyName: 1,
                    companyBillingAddress: 1,
                    placesOfBusiness: 1,
                    GSTIN: 1,
                    contactInfo: 1,
                    SOSignatureUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$SOSignature"]},
                    SOPdfHeaderUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$SOPdfHeader"]}
                }
            })
            .populate("salesInvoiceDetails.SOId")
            .populate("shipmentPlanningId", "billFromLocation")
            .populate("salesInvoiceDetails.SKU")
            .populate("customer")
            .lean();
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Sales Invoice");
            return res.unprocessableEntity(errors);
        }
        const transporterObj = await TransporterRepository.findOneDoc(
            {
                name: existing.transporter,
                status: OPTIONS.defaultStatus.ACTIVE
            },
            {licenseNumber: 1}
        );
        existing.transporterId = transporterObj?.licenseNumber;
        if (existing.company.placesOfBusiness.length > 0) {
            for (const e of existing.company.placesOfBusiness) {
                if (e.locationID == existing.billFromLocation && e.SOPdfHeader) {
                    existing.company.SOPdfHeaderUrl = `${CONSTANTS.domainUrl}company/` + e.SOPdfHeader;
                    existing.company.GSTIN = e.GSTINForAdditionalPlace;
                    existing.company.companyBillingAddress = e;
                }
                if (e.locationID == existing.billFromLocation && e.SOSignature) {
                    existing.company.SOSignatureUrl = `${CONSTANTS.domainUrl}company/` + e.SOSignature;
                    existing.company.GSTIN = e.GSTINForAdditionalPlace;
                    existing.company.companyBillingAddress = e;
                }
            }
        }
        if (existing.customer.GSTClassification == "SEZ") {
            existing.salesInvoiceDetails = existing.salesInvoiceDetails.map(x => {
                x.igst = 0;
                x.cgst = 0;
                x.sgst = 0;
                x.ugst = 0;
                x.SgstAmt = 0;
                x.CgstAmt = 0;
                return x;
            });
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Sales Invoice", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let location = await getCompanyLocationsWithGST(req.user.company);
        const salesInvObj = await AutoIncrementRepository.findOneDoc(
            {
                moduleName: SALES_INVOICE.MODULE_NAME,
                module: SALES_INVOICE.MODULE
            },
            {
                modulePrefix: 1,
                digit: 1,
                _id: 0
            }
        );
        let autoIncrementedValues = {};
        for await (const ele of location) {
            let subAutoIncrement = {
                location: ele.GSTINForAdditionalPlace,
                digit: salesInvObj?.digit ?? 4,
                modulePrefix: salesInvObj?.modulePrefix ?? SALES_INVOICE.MODULE_PREFIX
            };
            let autoIncrementNo = await getAndSetAutoIncrementNo(
                {...SALES_INVOICE.AUTO_INCREMENT_DATA(), subAutoIncrement},
                req.user.company
            );
            autoIncrementedValues[ele.locationID] = autoIncrementNo;
        }
        let shipmentList = await getAllShipmentPlannings(req.user.company);
        return res.success({shipmentList, autoIncrementedValues});
    } catch (error) {
        console.error("getAllMasterData SalesInvoice", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.previewTaxInv = asyncHandler(async (req, res) => {
    try {
        let createdObj = await getDataPDF(req);
        createdObj = JSON.parse(JSON.stringify(createdObj));
        createdObj.company = await getCompanyById(req.user.company);
        createdObj.company = JSON.parse(JSON.stringify(createdObj.company));
        createdObj.company.SOPdfHeaderUrl = `${CONSTANTS.domainUrl}company/` + createdObj.company.SOPdfHeader;
        createdObj.company.SOSignatureUrl = `${CONSTANTS.domainUrl}company/` + createdObj.company.SOSignature;
        if (createdObj && createdObj.company.placesOfBusiness.length > 0) {
            for (const e of createdObj.company.placesOfBusiness) {
                if (e.locationID == createdObj.billFromLocation && e.SOPdfHeader) {
                    createdObj.company.SOPdfHeaderUrl = `${CONSTANTS.domainUrl}company/` + e.SOPdfHeader;
                }
                if (e.locationID == createdObj.billFromLocation && e.SOSignature) {
                    createdObj.company.SOSignatureUrl = `${CONSTANTS.domainUrl}company/` + e.SOSignature;
                }
                if (e.locationID == createdObj.billFromLocation && e.TISignature) {
                    createdObj.company.TISignatureUrl = `${CONSTANTS.domainUrl}company/` + e.TISignature;
                }
            }
        }
        if (createdObj.customer.customerContactInfo.length) {
            createdObj.customer.customerContactInfo = createdObj.customer.customerContactInfo[0];
        }
        createdObj.featureConfig = await filteredSubModuleManagementList([
            {
                $match: {
                    _id: ObjectId("655c3c3c3613e949b4d62072")
                }
            },
            {
                $unwind: "$featureConfig"
            },
            {
                $match: {
                    "featureConfig.status": true
                }
            },
            {
                $project: {
                    featureCode: "$featureConfig.featureCode",
                    value: "$featureConfig.value"
                }
            }
        ]);
        return res.success(createdObj);
    } catch (e) {
        console.error("create SalesInvoice", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllSILineDetails = asyncHandler(async (req, res) => {
    try {
        const {customer = null, fromDate = null, toDate = null} = req.query;
        let project = getAllSILineDetailsAttributes();
        let query = {
            company: ObjectId(req.user.company),
            ...(!!customer && {
                customer: {$eq: ObjectId(customer)}
            }),
            ...(!!toDate &&
                !!fromDate && {
                    salesInvoiceDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let customers = await getAllCustomers(req.user.company, {customerName: 1, company: 0});
        let pipeline = [
            {$match: query},
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {GSTIN: 1, customerName: 1, customerCategory: 1, region: 1}}],
                    as: "customer"
                }
            },
            {$unwind: "$customer"},
            {
                $addFields: {
                    salesInvoiceDateS: {$dateToString: {format: "%d-%m-%Y", date: "$salesInvoiceDate"}},
                    TD: 0,
                    exportsCategory: {
                        $regexMatch: {input: "$customer.customerCategory", regex: /exports/, options: "i"}
                    }
                }
            },
            {$unwind: "$salesInvoiceDetails"},
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "salesInvoiceDetails.SKU",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                SKUNo: 1,
                                primaryUnit: 1,
                                SKUDescription: 1,
                                SKUName: 1,
                                customerInfo: {$arrayElemAt: ["$customerInfo", 0]}
                            }
                        }
                    ],
                    as: "SKU"
                }
            },
            {$unwind: "$SKU"},
            {
                $addFields: {
                    IGSTAmount: {
                        $cond: [
                            {$and: [{$ne: ["$salesInvoiceTotalIGSTAmount", 0]}, {$eq: ["$exportsCategory", false]}]},
                            {
                                $divide: [
                                    {
                                        $multiply: [
                                            "$salesInvoiceDetails.salesInvoiceLineValue",
                                            "$salesInvoiceDetails.igst"
                                        ]
                                    },
                                    100
                                ]
                            },
                            0
                        ]
                    },
                    CGSTAmount: {
                        $cond: [
                            {$and: [{$eq: ["$salesInvoiceTotalIGSTAmount", 0]}, {$eq: ["$exportsCategory", false]}]},
                            {
                                $divide: [
                                    {
                                        $multiply: [
                                            "$salesInvoiceDetails.salesInvoiceLineValue",
                                            "$salesInvoiceDetails.cgst"
                                        ]
                                    },
                                    100
                                ]
                            },
                            0
                        ]
                    },
                    SGSTAmount: {
                        $cond: [
                            {$and: [{$eq: ["$salesInvoiceTotalIGSTAmount", 0]}, {$eq: ["$exportsCategory", false]}]},
                            {
                                $divide: [
                                    {
                                        $multiply: [
                                            "$salesInvoiceDetails.salesInvoiceLineValue",
                                            "$salesInvoiceDetails.sgst"
                                        ]
                                    },
                                    100
                                ]
                            },
                            0
                        ]
                    },
                    IGSTAmountWithTD: {
                        $cond: [
                            {$and: [{$ne: ["$salesInvoiceTotalIGSTAmount", 0]}, {$eq: ["$exportsCategory", false]}]},
                            "$salesInvoiceDetails.salesInvoiceLineValue",
                            0
                        ]
                    },
                    SGST_CGSTAmountWithTD: {
                        $cond: [
                            {$and: [{$eq: ["$salesInvoiceTotalIGSTAmount", 0]}, {$eq: ["$exportsCategory", false]}]},
                            "$salesInvoiceDetails.salesInvoiceLineValue",
                            0
                        ]
                    }
                }
            }
        ];
        let rows = await SalesInvoiceRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $project: {
                        salesInvoiceTotalAmount: "$salesInvoiceLineValue",
                        salesInvoiceTotalTaxAmount: {
                            $sum: [
                                "$salesInvoiceTotalCGSTAmount",
                                "$salesInvoiceTotalSGSTAmount",
                                "$salesInvoiceTotalIGSTAmount",
                                "$salesInvoiceTotalUGSTAmount"
                            ]
                        },
                        salesInvoiceTotalAmountWithTax: {
                            $sum: [
                                "$salesInvoiceLineValue",
                                "$salesInvoiceTotalCGSTAmount",
                                "$salesInvoiceTotalSGSTAmount",
                                "$salesInvoiceTotalIGSTAmount",
                                "$salesInvoiceTotalUGSTAmount"
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalLineValue: {$sum: "$salesInvoiceTotalAmount"},
                        totalTaxAmount: {$sum: "$salesInvoiceTotalTaxAmount"},
                        totalAmountWithTax: {$sum: "$salesInvoiceTotalAmountWithTax"}
                    }
                },
                {
                    $project: {
                        totalLineValue: 1,
                        totalTaxAmount: 1,
                        totalAmountWithTax: 1,
                        _id: 0
                    }
                }
            ]
        });
        return res.success({
            ...rows,
            customers
        });
    } catch (e) {
        console.error("getAllSILineValue", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

async function getDataPDF(req) {
    try {
        let customer = await getB2BCustomerById(req.body.customer);
        let shipmentPlanning = await getShipmentPlanningById(req.body.shipmentPlanningId);
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body,
            categoryType: shipmentPlanning?.categoryType,
            billFromLocation: shipmentPlanning.billFromLocation ? shipmentPlanning.billFromLocation : "",
            customerBillingAddress: customer?.customerBillingAddress.length
                ? customer?.customerBillingAddress[0]
                : null,
            customerShippingAddress: shipmentPlanning.customerShippingAddress
                ? shipmentPlanning.customerShippingAddress
                : customer?.customerShippingAddress.length
                ? customer?.customerShippingAddress[0]
                : null,
            salesInvoiceStatus: "Closed",
            paymentTerms: customer?.customerPaymentTerms,
            modeOfTransport: shipmentPlanning?.modeOfTransport,
            salesInvoiceDetails: [],
            GSTDetails: [],
            exportsInfo: shipmentPlanning?.exportsInfo,
            PINumber: shipmentPlanning?.PINumber,
            PIDate: shipmentPlanning?.PIDate,
            PONumber: shipmentPlanning?.PONumber,
            PODate: shipmentPlanning?.PODate,
            customerCategory: shipmentPlanning?.customerCategory,
            ARNNo: customer?.company?.exportsDetails?.LUTNo,
            ARNDate: customer?.company?.exportsDetails?.LUTDate,
            salesInvoiceTotalAmount: 0,
            salesInvoiceTotalCGSTAmount: 0,
            salesInvoiceTotalSGSTAmount: 0,
            salesInvoiceTotalIGSTAmount: 0,
            salesInvoiceTotalUGSTAmount: 0,
            salesInvoiceTotalTaxAmount: 0,
            salesInvoiceTotalAmountWithTax: 0
        };
        let customerCategoryCondition =
            (await checkDomesticCustomer(customer.categoryType)) && customer.GSTClassification != "SEZ";
        let condition = false;
        if (customer && customer.company && customer.company.placesOfBusiness.length > 0 && customerCategoryCondition) {
            for (const ele of customer.company.placesOfBusiness) {
                if (createdObj.billFromLocation == ele.locationID) {
                    if (customer.GSTClassification == GST_CLASSIFICATION.UNREGISTER_DEALER) {
                        condition =
                            createdObj?.customerBillingAddress?.state?.trim()?.toLowerCase() !=
                            ele?.state?.trim()?.toLowerCase();
                    } else {
                        condition = customer?.GSTIN?.substring(0, 2) != ele?.GSTINForAdditionalPlace.substring(0, 2);
                    }
                }
            }
        }
        createdObj.salesInvoiceDetails = shipmentPlanning?.SPDetails.map((x, i) => {
            return {
                salesInvoiceLineNumber: i + 1,
                SONumber: x.SONumber,
                SOId: x.SOId,
                SPLineNumber: x.SPLineNumber,
                batchId: x.FGINId,
                batchDate: x.FGINMfgDate,
                dispatchQty: x.dispatchQty,
                invoicedQty: x.invoicedQty,
                unit: x.UOM,
                salesInvoiceUnitRate: x.netRate,
                salesInvoiceLineValue: x.lineValue,
                currency: x.currency,
                discount: x.discount,
                purchaseRate: x.purchaseRate,
                SKU: x.SKU,
                HSNCode: x.SKU.HSNCode,
                HSN: x.SKU.HSN,
                igst: x.SKU.igst,
                cgst: x.SKU.cgst,
                sgst: x.SKU.sgst,
                ugst: x.SKU.ugst,
                IgstAmt: condition ? +((+x.SKU.igst * +x.lineValue) / 100).toFixed(2) : 0,
                CgstAmt: condition ? 0 : +((+x.SKU.cgst * +x.lineValue) / 100).toFixed(2),
                SgstAmt: condition ? 0 : +((+x.SKU.sgst * +x.lineValue) / 100).toFixed(2),
                tBatchNo: x.batchDate
            };
        });
        createdObj.otherCharges = shipmentPlanning?.otherCharges;
        if (shipmentPlanning.SPDetails.length) {
            createdObj.frightCharge = shipmentPlanning?.frightCharge
                ? shipmentPlanning?.frightCharge
                : shipmentPlanning?.SPDetails[0]?.SOId?.frightCharge;

            createdObj.frightTerms = shipmentPlanning?.frightTerms
                ? shipmentPlanning?.frightTerms
                : shipmentPlanning?.SPDetails[0]?.SOId?.frightTerms;

            createdObj.transporter = shipmentPlanning?.transporter
                ? shipmentPlanning?.transporter
                : shipmentPlanning?.SPDetails[0]?.SOId?.transporter;

            createdObj.destination = shipmentPlanning?.destination
                ? shipmentPlanning?.destination
                : shipmentPlanning?.SPDetails[0]?.SOId?.destination;
        }
        createdObj.customer = customer;
        if (customerCategoryCondition) {
            createdObj = await previewSalesDomestic(createdObj, condition);
        } else {
            createdObj = await previewSalesExports(createdObj);
        }
        if (createdObj.customer.printQRCodeOnInvoice == BOOLEAN_VALUES.YES) {
            createdObj.salesInvoiceDetails = createdObj.salesInvoiceDetails.map(ele => {
                ele.QRCode = [
                    ele?.SOId?.PONumber ?? " ",
                    "1",
                    ele?.dispatchQty ?? " ",
                    createdObj?.customer?.company?.GSTIN ?? " ",
                    dateToAnyFormat(new Date(createdObj?.salesInvoiceDate), "DD.MM.YYYY") ?? " ",
                    ele?.purchaseRate?.toFixed(2) ?? "0.00",
                    ele?.salesInvoiceUnitRate?.toFixed(2) ?? "0.00",
                    createdObj?.customer?.venderCode ?? " ",
                    ele?.SKU?.customerInfo[0]?.customerPartNo ?? " ",
                    createdObj?.salesInvoiceTotalCGSTAmount?.toFixed(2) ?? "0.00",
                    createdObj?.salesInvoiceTotalSGSTAmount?.toFixed(2) ?? "0.00",
                    createdObj?.salesInvoiceTotalIGSTAmount?.toFixed(2) ?? "0.00",
                    "0.00",
                    createdObj?.salesInvoiceTotalCGSTAmount != 0 ? ele?.cgst?.toFixed(2) : "0.00" ?? "0.00",
                    createdObj?.salesInvoiceTotalSGSTAmount != 0 ? ele?.sgst?.toFixed(2) : "0.00" ?? "0.00",
                    createdObj?.salesInvoiceTotalIGSTAmount != 0 ? ele?.igst?.toFixed(2) : "0.00" ?? "0.00",
                    "0.00",
                    "0.00",
                    createdObj?.salesInvoiceTotalAmountWithTax?.toFixed(2) ?? "0.00",
                    ele?.SKU?.hsn ?? " "
                ].join(",");
                return ele;
            });
        }
        return createdObj;
    } catch (error) {
        console.error(error);
    }
}

async function previewSalesExports(createdObj) {
    let hsnArr = [...new Set(createdObj?.salesInvoiceDetails.map(x => x.HSNCode))];
    for (let i = 0; i < hsnArr.length; i++) {
        const element = hsnArr[i];
        let arr = createdObj?.salesInvoiceDetails.filter(m => m.HSNCode == element);
        let salesInvoiceLineValue = Number(arr.map(y => +y.salesInvoiceLineValue).reduce((a, c) => a + c, 0)).toFixed(
            2
        );
        let igstRate = 0;
        let igstAmount = 0;
        let cgstRate = 0;
        let cgstAmount = 0;
        let sgstRate = 0;
        let sgstAmount = 0;
        let ugstRate = 0;
        let ugstAmount = 0;
        createdObj.GSTDetails.push({
            HSNCode: arr[0].HSNCode,
            taxableValue: +salesInvoiceLineValue,
            igstRate: igstRate,
            igstAmount: igstAmount,
            cgstRate: cgstRate,
            cgstAmount: cgstAmount,
            sgstRate: sgstRate,
            sgstAmount: sgstAmount,
            ugstRate: ugstRate,
            ugstAmount: ugstAmount,
            totalTaxableValue: Number(
                +salesInvoiceLineValue + +cgstAmount + +igstAmount + +sgstAmount + +ugstAmount
            ).toFixed(2)
        });
    }
    if (createdObj.otherCharges && createdObj.otherCharges.totalAmount) {
        let lineValue = +createdObj?.otherCharges?.totalAmount;
        createdObj.GSTDetails.push({
            HSNCode: "996511",
            taxableValue: +lineValue,
            igstRate: 0,
            igstAmount: 0,
            cgstRate: 0,
            cgstAmount: 0,
            sgstRate: 0,
            sgstAmount: 0,
            ugstRate: 0,
            ugstAmount: 0,
            totalTaxableValue: Number(+lineValue).toFixed(2)
        });
    }
    createdObj.salesInvoiceTotalIGSTAmount = 0;
    createdObj.salesInvoiceTotalTaxAmount = 0;
    createdObj.salesInvoiceTotalAmount = createdObj?.GSTDetails.map(y => +y.taxableValue).reduce((a, c) => a + c, 0);
    createdObj.salesInvoiceTotalAmountWithTax = createdObj?.GSTDetails.map(y => +y.totalTaxableValue).reduce(
        (a, c) => a + c,
        0
    );
    createdObj.roundedOff = 0;
    createdObj.roundedOff +=
        Math.round(createdObj.salesInvoiceTotalAmountWithTax) - +createdObj.salesInvoiceTotalAmountWithTax;
    createdObj.salesInvoiceTotalAmountWithTax = Math.round(createdObj.salesInvoiceTotalAmountWithTax);
    return createdObj;
}
async function previewSalesDomestic(createdObj, condition) {
    let hsnArr = [...new Set(createdObj?.salesInvoiceDetails.map(x => x.HSNCode))];
    for (let i = 0; i < hsnArr.length; i++) {
        const element = hsnArr[i];
        let arr = createdObj?.salesInvoiceDetails.filter(m => m.HSNCode == element);
        let salesInvoiceLineValue = Number(arr.map(y => +y.salesInvoiceLineValue).reduce((a, c) => a + c, 0)).toFixed(
            2
        );
        let igstRate = 0;
        let igstAmount = 0;
        let cgstRate = 0;
        let cgstAmount = 0;
        let sgstRate = 0;
        let sgstAmount = 0;
        let ugstRate = 0;
        let ugstAmount = 0;
        if (condition) {
            igstRate = arr[0]?.igst ?? 0;
            igstAmount = (+igstRate * +salesInvoiceLineValue) / 100;
        } else {
            cgstRate = arr[0]?.cgst ?? 0;
            cgstAmount = (+cgstRate * +salesInvoiceLineValue) / 100;
            sgstRate = arr[0]?.sgst ?? 0;
            sgstAmount = (+sgstRate * +salesInvoiceLineValue) / 100;
        }
        createdObj.GSTDetails.push({
            HSNCode: arr[0].HSNCode,
            taxableValue: +salesInvoiceLineValue,
            igstRate: igstRate,
            igstAmount: igstAmount,
            cgstRate: cgstRate,
            cgstAmount: cgstAmount,
            sgstRate: sgstRate,
            sgstAmount: sgstAmount,
            ugstRate: ugstRate,
            ugstAmount: ugstAmount,
            totalTaxableValue: Number(
                +salesInvoiceLineValue + +cgstAmount + +igstAmount + +sgstAmount + +ugstAmount
            ).toFixed(2)
        });
    }
    if (createdObj.otherCharges && createdObj.otherCharges.totalAmount) {
        let lineValue = +createdObj?.otherCharges?.totalAmount;
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
        createdObj.GSTDetails.push({
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
    createdObj.salesInvoiceTotalCGSTAmount = createdObj?.GSTDetails.map(y => +y.cgstAmount).reduce((a, c) => a + c, 0);
    createdObj.salesInvoiceTotalSGSTAmount = createdObj?.GSTDetails.map(y => +y.sgstAmount).reduce((a, c) => a + c, 0);
    createdObj.salesInvoiceTotalIGSTAmount = createdObj?.GSTDetails.map(y => +y.igstAmount).reduce((a, c) => a + c, 0);
    createdObj.salesInvoiceTotalUGSTAmount = createdObj?.GSTDetails.map(y => +y.ugstAmount).reduce((a, c) => a + c, 0);
    createdObj.salesInvoiceTotalTaxAmount =
        +createdObj.salesInvoiceTotalSGSTAmount +
        +createdObj.salesInvoiceTotalIGSTAmount +
        +createdObj.salesInvoiceTotalCGSTAmount +
        +createdObj.salesInvoiceTotalUGSTAmount;
    createdObj.salesInvoiceTotalAmount = createdObj?.GSTDetails.map(y => +y.taxableValue).reduce((a, c) => a + c, 0);
    createdObj.salesInvoiceTotalAmountWithTax = createdObj?.GSTDetails.map(y => +y.totalTaxableValue).reduce(
        (a, c) => a + c,
        0
    );
    if (createdObj.customer && createdObj.customer.TCSOnScrap == BOOLEAN_VALUES.YES) {
        createdObj.TCSOnScrap = +((createdObj.salesInvoiceTotalAmountWithTax * 1) / 100).toFixed(2);
        createdObj.salesInvoiceTotalAmountWithTax += createdObj.TCSOnScrap;
    } else if (createdObj.customer && createdObj.customer.TCSOnVendor == BOOLEAN_VALUES.YES) {
        createdObj.TCSOnVendor = +((createdObj.salesInvoiceTotalAmountWithTax * 0.1) / 100).toFixed(2);
        createdObj.salesInvoiceTotalAmountWithTax += createdObj.TCSOnVendor;
    }
    createdObj.roundedOff = 0;
    createdObj.roundedOff +=
        Math.round(createdObj.salesInvoiceTotalAmountWithTax) - +createdObj.salesInvoiceTotalAmountWithTax;
    createdObj.salesInvoiceTotalAmountWithTax = Math.round(createdObj.salesInvoiceTotalAmountWithTax);
    return createdObj;
}
exports.getAllEwayBillList = asyncHandler(async (req, res) => {
    try {
        const {type = null, category = null} = req.query;
        let query = {
            salesInvoiceDate: {
                $gte: new Date(getSubtractedDate(2, "d"))
            },
            company: ObjectId(req.user.company),
            ...(!!category && category == "Exports"
                ? {categoryType: {$regex: SALES_CATEGORY.EXPORTS_REGEX}}
                : {
                      $or: [{categoryType: {$exists: false}}, {categoryType: {$regex: SALES_CATEGORY.DOMESTIC_REGEX}}]
                  }),

            ...(type == "EwayBill" && {
                ewayBillNo: {$exists: false}
            }),
            ...(type == "EInvoice" && {
                Irn: {$exists: false}
            })
        };
        let rows = await SalesInvoiceRepository.getFilterSalesInvoiceList([
            {
                $match: query
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {GSTIN: 1, customerName: 1, GSTIN: 1}}],
                    as: "customer"
                }
            },
            {$unwind: "$customer"},
            {
                $addFields: {
                    lookupName: "$customer.customerName",
                    lookupGSTNo: "$customer.GSTIN"
                }
            },
            {
                $sort: {createdAt: -1}
            }
        ]);
        return res.success(rows);
    } catch (e) {
        console.error("getAllEwayBillList", e);
    }
});
exports.updateSalesInvoiceStatusOnASN = asyncHandler(async salesInvoiceId => {
    try {
        let salesInvoice = await SalesInvoiceRepository.getDocById(salesInvoiceId);
        salesInvoice.isDispatched = true;
        await salesInvoice.save();
    } catch (error) {
        console.error("updatePOQtyOnGRN::::: Error in updating Purchase Order ======= ", error);
    }
});
exports.getAllSalesInvoiceForPDIR = async (company, customerId) => {
    try {
        let rows = await Model.find({
            isPDIR: {$ne: true},
            company: company,
            customer: customerId
        })
            .populate("customer", "customerName ")
            .sort({createdAt: -1});
        return rows;
    } catch (e) {
        console.error("getAllSalesInvoiceForPDIR", e);
    }
};
exports.getAllBySalesInvoiceById = asyncHandler(async (salesInvoiceId, company) => {
    try {
        let rows = await Model.findById(salesInvoiceId, {
            _id: 1,
            salesInvoiceNumber: 1,
            salesInvoiceDate: 1,
            invoiceValue: "$salesInvoiceTotalAmountWithTax",
            company: 1,
            customer: 1,
            salesInvoiceDetails: 1,
            billFromLocation: 1
        })
            .populate("company", "companyBillingAddress placesOfBusiness")
            .populate("customer", "customerName customerShippingAddress")
            .populate("salesInvoiceDetails.SOId", "PONumber")
            .populate("salesInvoiceDetails.SKU", "SKUNo SKUName SKUDescription")
            .lean();
        const salesInvPrefixGSTIN = rows.company.placesOfBusiness.find(
            x => x.locationID == rows.billFromLocation
        )?.GSTINForAdditionalPlace;
        const salesInvObj = await AutoIncrementRepository.filteredAutoIncrementList([
            {
                $unwind: "$locationCounters"
            },
            {
                $match: {
                    "locationCounters.location": salesInvPrefixGSTIN
                }
            },
            {
                $project: {
                    _id: 0,
                    modulePrefix: "$locationCounters.modulePrefix"
                }
            },
            {
                $limit: 1
            }
        ]);
        rows.salesInvModulePrefix = salesInvObj.length > 0 ? salesInvObj[0]?.modulePrefix : SALES_INVOICE.MODULE_PREFIX;
        return rows;
    } catch (e) {
        console.error("getAllBySalesInvoiceById", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllBySalesInvoiceByIdForPDIR = async (salesInvoiceId, company) => {
    try {
        let rows = await Model.findById(salesInvoiceId, {
            _id: 1,
            salesInvoiceNumber: 1,
            salesInvoiceDate: 1,
            salesInvoiceDetails: 1,
            billFromLocation: 1
        })
            .populate("customer", "customerName ")
            .populate("company", "contactInfo placesOfBusiness")
            .populate("salesInvoiceDetails.SKU", "customerInfo SKUNo SKUName SKUDescription productCategory")
            .lean();
        const salesInvPrefixGSTIN = rows.company.placesOfBusiness.find(
            x => x.locationID == rows.billFromLocation
        )?.GSTINForAdditionalPlace;
        const salesInvObj = await AutoIncrementRepository.filteredAutoIncrementList([
            {
                $unwind: "$locationCounters"
            },
            {
                $match: {
                    "locationCounters.location": salesInvPrefixGSTIN
                }
            },
            {
                $project: {
                    _id: 0,
                    modulePrefix: "$locationCounters.modulePrefix"
                }
            },
            {
                $limit: 1
            }
        ]);
        rows.salesInvModulePrefix = salesInvObj.length > 0 ? salesInvObj[0]?.modulePrefix : SALES_INVOICE.MODULE_PREFIX;
        return rows;
    } catch (e) {
        console.error("getAllBySalesInvoiceById", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
exports.updateSalesInvoiceOnEwayBillGenerate = asyncHandler(async (salesInvoiceId, data) => {
    try {
        await Model.updateOne({_id: salesInvoiceId}, data);
    } catch (error) {
        console.error("updatePOQtyOnGRN::::: Error in updating Purchase Order ======= ", error);
    }
});

exports.getSalesInvoiceByIdForPDF = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id)
            .populate({
                path: "company",
                model: "Company",
                select: {
                    companyName: 1,
                    GSTIN: 1,
                    companyContactPersonEmail: 1,
                    placesOfBusiness: 1,
                    swiftCode: 1,
                    companyBankMICRCode: 1,
                    intermediaryBank: 1,
                    companyBefName: 1,
                    companyBankName: 1,
                    companyAccountNumber: 1,
                    companyBankIFSCCode: 1,
                    companyBankBranch: 1,
                    intermediaryBankSwiftCode: 1,
                    TIDomesticTemplates: 1,
                    TIExportsTemplates: 1,
                    accountsDetails: 1,
                    exportsDetails: 1,
                    logoUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$logo"]},
                    companySignatureUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$companySignature"]},
                    companyPdfHeaderUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$companyPdfHeader"]},
                    SOSignatureUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$SOSignature"]},
                    SOPdfHeaderUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$SOPdfHeader"]}
                }
            })
            .populate("salesInvoiceDetails.SOId")
            .populate("shipmentPlanningId", "billFromLocation")
            .populate("salesInvoiceDetails.SKU")
            .populate("customer")
            .lean();
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Sales Invoice");
            return res.unprocessableEntity(errors);
        }
        if (existing.customer.printQRCodeOnInvoice == BOOLEAN_VALUES.YES) {
            existing.salesInvoiceDetails = existing.salesInvoiceDetails.map(ele => {
                ele.QRCode = [
                    ele?.SOId?.PONumber ?? " ",
                    "10",
                    ele?.dispatchQty ?? " ",
                    existing?.salesInvoiceNumber ?? " ",
                    dateToAnyFormat(new Date(existing?.salesInvoiceDate), "DD.MM.YYYY") ?? " ",
                    ele?.purchaseRate?.toFixed(2) ?? "0.00",
                    ele?.salesInvoiceUnitRate?.toFixed(2) ?? "0.00",
                    existing?.customer?.venderCode ?? " ",
                    ele?.SKU?.customerInfo[0]?.customerPartNo ?? " ",
                    existing?.salesInvoiceTotalCGSTAmount?.toFixed(2) ?? "0.00",
                    existing?.salesInvoiceTotalSGSTAmount?.toFixed(2) ?? "0.00",
                    existing?.salesInvoiceTotalIGSTAmount?.toFixed(2) ?? "0.00",
                    "0.00",
                    existing?.salesInvoiceTotalCGSTAmount != 0 ? ele?.cgst?.toFixed(2) : "0.00" ?? "0.00",
                    existing?.salesInvoiceTotalSGSTAmount != 0 ? ele?.sgst?.toFixed(2) : "0.00" ?? "0.00",
                    existing?.salesInvoiceTotalIGSTAmount != 0 ? ele?.igst?.toFixed(2) : "0.00" ?? "0.00",
                    "0.00",
                    "0.00",
                    existing?.salesInvoiceTotalAmountWithTax?.toFixed(2) ?? "0.00",
                    ele?.SKU?.hsn ?? " "
                ].join(",");
                return ele;
            });
        }
        if (existing && existing.company.placesOfBusiness.length > 0) {
            for (const e of existing.company.placesOfBusiness) {
                if (e.locationID == existing.billFromLocation && e.SOPdfHeader) {
                    existing.company.SOPdfHeaderUrl = `${CONSTANTS.domainUrl}company/` + e.SOPdfHeader;
                }
                if (e.locationID == existing.billFromLocation && e.SOSignature) {
                    existing.company.SOSignatureUrl = `${CONSTANTS.domainUrl}company/` + e.SOSignature;
                }
                if (e.locationID == existing.billFromLocation && e.TISignature) {
                    existing.company.TISignatureUrl = `${CONSTANTS.domainUrl}company/` + e.TISignature;
                }
            }
        }
        if (existing.customer.customerShippingAddress.length) {
            existing.customer.customerShippingAddress = existing.customer.customerShippingAddress[0];
        }
        if (existing.customer.customerBillingAddress.length) {
            existing.customer.customerBillingAddress = existing.customer.customerBillingAddress[0];
        }

        if (existing.customer.customerContactInfo.length) {
            existing.customer.customerContactInfo = existing.customer.customerContactInfo[0];
        }
        if (existing.salesInvoiceDetails.length) {
            let arr = [];
            for await (const x of existing?.salesInvoiceDetails) {
                x.unit = await salesUOMPipe(x.unit, existing.company._id);
                let HSN = await getSalesHSNByCode(x.SKU.hsn);
                x.SKU.HSNCode = HSN?.hsnCode;
                x.SKU.HSN = HSN?._id;
                x.SKU.igst = HSN?.igstRate;
                x.SKU.cgst = HSN?.cgstRate;
                x.SKU.sgst = HSN?.sgstRate;
                x.SKU.ugst = HSN?.ugstRate;
                arr.push(x);
            }
            existing.salesInvoiceDetails = arr;
        }
        let customerCategoryCondition =
            (await checkDomesticCustomer(existing.customer.categoryType)) &&
            existing.customer.GSTClassification != "SEZ";
        let condition = false;
        if (
            existing &&
            existing?.company &&
            existing?.company.placesOfBusiness.length > 0 &&
            customerCategoryCondition
        ) {
            for (const ele of existing.company.placesOfBusiness) {
                if (existing.billFromLocation == ele.locationID) {
                    if (existing.customer.GSTClassification == GST_CLASSIFICATION.UNREGISTER_DEALER) {
                        condition =
                            existing?.customer?.customerBillingAddress?.state?.trim()?.toLowerCase() !=
                            ele?.state?.trim()?.toLowerCase();
                    } else {
                        condition =
                            existing.customer.GSTIN.substring(0, 2) != ele.GSTINForAdditionalPlace.substring(0, 2);
                    }
                }
            }
        }
        existing.ARNNo = existing?.company?.exportsDetails?.LUTNo;
        existing.ARNDate = existing?.company?.exportsDetails?.LUTDate;
        existing.totalTaxableAmount = existing.salesInvoiceDetails.map(x => +x.lineValue).reduce((a, c) => a + c, 0);
        existing.GSTDetails = [];
        if (customerCategoryCondition) {
            existing = await previewSalesDomestic(existing, condition);
        } else {
            existing = await previewSalesExports(existing);
        }
        existing.featureConfig = await filteredSubModuleManagementList([
            {
                $match: {
                    _id: ObjectId("655c3c3c3613e949b4d62072")
                }
            },
            {
                $unwind: "$featureConfig"
            },
            {
                $match: {
                    "featureConfig.status": true
                }
            },
            {
                $project: {
                    featureCode: "$featureConfig.featureCode",
                    value: "$featureConfig.value"
                }
            }
        ]);
        return res.success(existing);
    } catch (e) {
        console.error("getById Proforma Invoice", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.updateSalesInvoiceOnPDIRGenerate = async (company, salesInvoiceId) => {
    try {
        await Model.updateOne({company: company, _id: salesInvoiceId}, {$set: {isPDIR: true}});
    } catch (error) {
        console.error("updateSalesInvoiceOnPDIRGenerate::::: Error in updating Sales Invoice ======= ", error);
    }
};

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await SalesInvoiceRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await SalesInvoiceRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("salesInvoice has been")
        });
    } catch (e) {
        console.error("update salesInvoice", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.createDirectTaxInvoice = async (body, preview) => {
    try {
        let createdObj = {
            GSTDetails: [],
            salesInvoiceStatus: OPTIONS.defaultStatus.CLOSED,
            ...body
        };
        let customerCategoryCondition =
            (await checkDomesticCustomer(createdObj.customer.categoryType)) &&
            createdObj?.customer?.GSTClassification != "SEZ";
        let taxCondition = false;
        if (createdObj?.company?.placesOfBusiness?.length > 0 && customerCategoryCondition) {
            for (const ele of createdObj.company.placesOfBusiness) {
                if (createdObj.billFromLocation == ele.locationID) {
                    taxCondition =
                        createdObj?.customer?.GSTIN?.substring(0, 2) != ele?.GSTINForAdditionalPlace?.substring(0, 2);
                }
            }
        }
        if (customerCategoryCondition) {
            createdObj = await previewSalesDomestic(createdObj, taxCondition);
        } else {
            createdObj = await previewSalesExports(createdObj);
        }
        if (!preview) {
            await SalesInvoiceRepository.createDoc(createdObj);
        }
        return createdObj;
    } catch (e) {
        console.error("create SalesInvoice", e);
    }
};
