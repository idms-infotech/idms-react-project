const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/dispatch/advanceShipmentNoticeModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {updateSalesInvoiceStatusOnASN, getAllBySalesInvoiceById} = require("../salesInvoice/salesInvoice");
const {CONSTANTS} = require("../../../../../config/config");
const {
    getAllAdvanceShipmentAttributes,
    getAllAdvanceShipmentReportAttributes
} = require("../../../../models/dispatch/helpers/advanceShipmentNoticeHelper");
// const {getASNMailConfig} = require("./advanceShipmentNoticeMail");
const {default: mongoose} = require("mongoose");
const {getFilterSalesInvoiceList} = require("../../../../models/dispatch/repository/salesInvoiceRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {getAllTransporter} = require("../../sales/transporter/transporter");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const ASNRepository = require("../../../../models/dispatch/repository/advanceShipmentNoticeRepository");
const MailTriggerRepository = require("../../../../models/settings/repository/mailTriggerRepository");
const {ADVANCE_SHIPMENT_NOTICE} = require("../../../../mocks/schemasConstant/dispatchConstant");
const {DISPATCH_MAIL_CONST} = require("../../../../mocks/mailTriggerConstants");
const {filteredLogisticsProviderList} = require("../../../../models/planning/repository/logisticsProviderRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllAdvanceShipmentAttributes();

        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    ASNStatus: {$ne: OPTIONS.defaultStatus.REPORT_GENERATED}
                }
            },
            {
                $lookup: {
                    from: "SalesInvoice",
                    localField: "salesInvoice",
                    foreignField: "_id",
                    pipeline: [{$project: {salesInvoiceNumber: 1}}],
                    as: "salesInvoice"
                }
            },
            {$unwind: "$salesInvoice"},
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

        let rows = await ASNRepository.getAllPaginate({pipeline, project, queryParams: req.query});
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
            await updateSalesInvoiceStatusOnASN(itemDetails.salesInvoice);
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Advance Shipment Notice")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Advance Shipment Notice", e);
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
        itemDetails = await generateCreateData(itemDetails, req.body);
        itemDetails = await itemDetails.save();
        if (itemDetails) {
            return res.success({
                message: `Advance Shipment Notice has been ${
                    itemDetails.SPStatus == "Created" ? "updated" : itemDetails.ASNStatus.toLowerCase()
                } successfully`
            });
        }
    } catch (e) {
        console.error("update Advance Shipment Notice", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("Advance Shipment Notice")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Advance Shipment Notice");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Advance Shipment Notice", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id)
            .populate("customer", "customerName")
            .populate("salesInvoice", "salesInvoiceNumber")
            .populate("salesInvoiceDetails.SKU", "SKUName SKUDescription");
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
exports.sendMailById = asyncHandler(async (req, res) => {
    try {
        res.success({
            message: MESSAGES.apiSuccessStrings.ADDED(
                "You request to send a mail has been successfully registered. The email will be send accordingly and you will be notified !"
            )
        });
        // await getASNMailConfig(req.params.id, req.user.company);
        const ASNData = await ASNRepository.getDocById(req.params.id, {
            _id: 0,
            ASNNumber: 1
        });
        let mailTriggerCreateObj = {
            subModuleId: req.params.id,
            action: "Notify Customer",
            company: req.user.company,
            mailAction: "Notify Customer",
            collectionName: ADVANCE_SHIPMENT_NOTICE.COLLECTION_NAME,
            message: `ASN report has been Generated - ${ASNData?.ASNNumber}`,
            module: DISPATCH_MAIL_CONST.ASN.MODULE,
            subModule: DISPATCH_MAIL_CONST.ASN.SUB_MODULE,
            isSent: false
        };
        await MailTriggerRepository.createDoc(mailTriggerCreateObj);
    } catch (e) {
        console.error("sendMailById Advance Shipment Notice", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getANSDetailsById = asyncHandler(async (req, res) => {
    try {
        let existing = await ASNRepository.filteredAdvanceShipmentList([
            {
                $match: {_id: ObjectId(req.params.id)}
            },
            {
                $lookup: {
                    from: "SalesInvoice",
                    localField: "salesInvoice",
                    foreignField: "_id",
                    pipeline: [{$project: {salesInvoiceNumber: 1, customerShippingAddress: 1}}],
                    as: "salesInvoice"
                }
            },
            {$unwind: "$salesInvoice"},
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
                                contactInfo: 1,
                                companyBillingAddress: 1,
                                SOSignatureUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$SOSignature"]},
                                companyPdfHeaderUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$companyPdfHeader"]},
                                SOPdfHeaderUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$SOPdfHeader"]},
                                logoUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$logo"]}
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
                    localField: "salesInvoiceDetails.SKU",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                customerInfo: 1,
                                SKUName: 1,
                                SKUDescription: 1
                            }
                        }
                    ],
                    as: "SKUInfo"
                }
            },
            {
                $lookup: {
                    from: "SalesOrder",
                    localField: "salesInvoiceDetails.SOId",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                PONumber: 1
                            }
                        }
                    ],
                    as: "SOInfo"
                }
            },
            {
                $addFields: {
                    salesInvoiceDetails: {
                        $map: {
                            input: "$salesInvoiceDetails",
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
                                    },
                                    {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: "$SOInfo",
                                                    as: "so",
                                                    cond: {$eq: ["$$so._id", "$$detail.SOId"]}
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
                    SKUInfo: 1,
                    company: 1,
                    ASNNumber: 1,
                    salesInvoice: 1,
                    salesInvoiceDate: 1,
                    customer: 1,
                    customerName: 1,
                    stateOfSupply: 1,
                    invoiceValue: 1,
                    totalNoOfBoxes: 1,
                    totalGrossWeight: 1,
                    ASNStatus: 1,
                    rowRepeat: 1,
                    salesInvoiceDetails: 1,
                    transporter: 1,
                    modeOfTransport: 1,
                    frightCharge: 1,
                    frightTerms: 1,
                    deliveryType: 1,
                    docketLR: 1,
                    docketLRDate: 1,
                    freight: 1
                }
            }
        ]);
        if (!existing.length) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Advance Shipment Notice");
            return res.unprocessableEntity(errors);
        } else {
            existing = existing[0];
            if (existing.salesInvoiceDetails?.length > 0) {
                for (let ele of existing.salesInvoiceDetails) {
                    ele.customerInfo = ele?.customerInfo?.find(
                        x => String(x.customer) == String(existing.customer._id)
                    );
                }
            }
            // console.log("existing.salesInvoiceDetails", existing.salesInvoiceDetails);
            if (existing?.company?.contactInfo?.length > 0) {
                existing.company.contactInfo = existing.company.contactInfo.find(x => x.department == "Sales");
            }
        }

        return res.success(existing);
    } catch (e) {
        console.error("getANSDetailsById Advance Shipment Notice", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const modeOfTransportsOptions = await getAllModuleMaster(req.user.company, "MODE_OF_TRANSPORT");
        const freightTermsOptions = await getAllModuleMaster(req.user.company, "FREIGHT_TERMS");
        const deliveryTypeOptions = await getAllModuleMaster(req.user.company, "DELIVERY_TYPE");
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
        const salesInvoices = await getFilterSalesInvoiceList([
            {$match: {company: ObjectId(req.user.company), isDispatched: {$ne: true}}},
            {$sort: {createdAt: -1}},
            {
                $project: {
                    _id: 1,
                    salesInvoiceNumber: 1
                }
            }
        ]);
        return res.success({
            salesInvoices,
            transporterOptions: [...logisticOptions, ...transporterOptions],
            modeOfTransportsOptions,
            freightTermsOptions,
            deliveryTypeOptions,
        });
    } catch (error) {
        console.error("getAllMasterData Advance Shipment Notice", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.ASNDetailsBySalesInvoiceId = asyncHandler(async (req, res) => {
    try {
        let salesInvoice = await getAllBySalesInvoiceById(req.params.id, req.user.company);
        salesInvoice = JSON.parse(JSON.stringify(salesInvoice));
        salesInvoice.ASNNumber = String(salesInvoice.salesInvoiceNumber).replace(
            new RegExp(salesInvoice?.salesInvModulePrefix, "g"),
            ""
        );
        salesInvoice.salesInvoiceDate = salesInvoice.salesInvoiceDate.split("T")[0];
        salesInvoice.stateOfSupply = salesInvoice?.customer?.customerShippingAddress[0]?.state;
        salesInvoice.customerName = salesInvoice.customer.customerName;
        salesInvoice.customer = salesInvoice.customer._id;
        salesInvoice.ASNStatus = "Created";
        salesInvoice.salesInvoiceDetails = JSON.parse(JSON.stringify(salesInvoice.salesInvoiceDetails));
        salesInvoice.salesInvoiceDetails = salesInvoice.salesInvoiceDetails.map(ele => {
            return {
                SKUNo: ele.SKU.SKUNo,
                SKUName: ele.SKU.SKUName,
                SKUDescription: ele.SKU.SKUDescription,
                SKU: ele.SKU._id,
                dispatchQty: ele.dispatchQty,
                dispatchQty: ele.dispatchQty,
                batchDate: ele.batchDate ? ele.batchDate.split("T")[0] : "",
                PONumber: ele.SOId.PONumber,
                SOId: ele.SOId._id,
                unit: ele.unit,
                salesInvoiceUnitRate: ele.salesInvoiceUnitRate,
                salesInvoiceLineValue: ele.salesInvoiceLineValue,
                HSNCode: ele.HSNCode,
                boxNos: null,
                boxDetails: []
            };
        });
        let {_id, ...rest} = salesInvoice;
        return res.success(rest);
    } catch (e) {
        console.error("ASN Details By Sales Invoice", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const {fromDate = null, toDate = null} = req.query;
        let project = getAllAdvanceShipmentReportAttributes();
        let query = {
            company: ObjectId(req.user.company),
            ASNStatus: OPTIONS.defaultStatus.REPORT_GENERATED,
            ...(!!toDate &&
                !!fromDate && {
                    salesInvoiceDate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let pipeline = [
            {$match: query},
            {
                $lookup: {
                    from: "SalesInvoice",
                    localField: "salesInvoice",
                    foreignField: "_id",
                    pipeline: [{$project: {salesInvoiceNumber: 1}}],
                    as: "salesInvoice"
                }
            },
            {$unwind: "$salesInvoice"},
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
        let rows = await ASNRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success({
            ...rows
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
