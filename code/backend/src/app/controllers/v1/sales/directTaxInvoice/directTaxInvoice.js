const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllDirectTaxInvoiceAttributes} = require("../../../../models/sales/helpers/directTaxInvoiceHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const DirectTaxInvoiceRepository = require("../../../../models/sales/repository/directTaxInvoiceRepository");
const {getCompanyLocationsWithGST, getCompanyById} = require("../../settings/company/company");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const {getAllTransporter} = require("../transporter/transporter");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {filteredCompanyList} = require("../../../../models/settings/repository/companyRepository");
const {getAllPaymentTerms} = require("../paymentTerms/paymentTerms");
const {filteredSKUMasterList} = require("../../../../models/sales/repository/SKUMasterRepository");
const {createDirectTaxInvoice} = require("../../dispatch/salesInvoice/salesInvoice");
const {OPTIONS} = require("../../../../helpers/global.options");
const {CONSTANTS} = require("../../../../../config/config");
const AutoIncrementRepository = require("../../../../models/settings/repository/autoIncrementRepository");
const {SALES_INVOICE} = require("../../../../mocks/schemasConstant/dispatchConstant");
const {getAllCustomerCategory} = require("../../settings/customerCategory/customerCategory");
const {filteredLogisticsProviderList} = require("../../../../models/planning/repository/logisticsProviderRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllDirectTaxInvoiceAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    DTIStatus: {$nin: [OPTIONS.defaultStatus.REPORT_GENERATED]}
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
        let rows = await DirectTaxInvoiceRepository.getAllPaginate({
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
        const itemDetails = await DirectTaxInvoiceRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Direct Tax Invoice")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Direct Tax Invoice", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await DirectTaxInvoiceRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await DirectTaxInvoiceRepository.updateDoc(itemDetails, req.body);
        if (itemDetails.DTIStatus == OPTIONS.defaultStatus.REPORT_GENERATED) {
            let salesInvData = JSON.parse(JSON.stringify(itemDetails));
            delete salesInvData._id;
            await createDirectTaxInvoice(salesInvData, false);
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Direct Tax Invoice has been")
        });
    } catch (e) {
        console.error("update Direct Tax Invoice", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await DirectTaxInvoiceRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Direct Tax Invoice")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Direct Tax Invoice");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Direct Tax Invoice", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await DirectTaxInvoiceRepository.filteredDirectTaxInvoiceList([
            {$match: {_id: ObjectId(req.params.id)}},
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
                                SKUName: 1
                            }
                        }
                    ],
                    as: "SKUInfo"
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
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        ]);
        if (!existing.length) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Direct Tax Invoice");
            return res.unprocessableEntity(errors);
        } else {
            existing = existing[0];
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Direct Tax Invoice", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getByIdForPDF = asyncHandler(async (req, res) => {
    try {
        let existing = await DirectTaxInvoiceRepository.filteredDirectTaxInvoiceList([
            {$match: {_id: ObjectId(req.params.id)}},
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                customerCurrency: 1,
                                customerName: 1,
                                customerContactInfo: 1,
                                TCSOnScrap: 1,
                                TCSOnVendor: 1,
                                GSTIN: 1,
                                showSKUDescription: 1,
                                GSTClassification: 1,
                                customerCategory: 1,
                                printQRCodeOnInvoice: 1,
                                customerContactInfo: {$first: "$customerContactInfo"}
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
                    salesInvoiceDetails: {
                        $map: {
                            input: "$salesInvoiceDetails",
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
                            $project: {
                                _id: 1,
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
                        }
                    ],
                    as: "company"
                }
            },
            {$unwind: "$company"},
            {
                $project: {
                    SKUInfo: 0,
                    createdAt: 0,
                    updatedAt: 0
                }
            }
        ]);
        if (!existing.length) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Direct Tax Invoice");
            return res.unprocessableEntity(errors);
        } else {
            existing = await createDirectTaxInvoice(existing[0], true);
            if (existing?.company?.placesOfBusiness.length > 0) {
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
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Direct Tax Invoice", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let billToOptions = await getCompanyLocationsWithGST(req.user.company);
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
        for await (const ele of billToOptions) {
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
                    customerName: 1,
                    customerCode: 1,
                    customerBillingState: "$customerBillingAddress.state",
                    customerBillingCity: "$customerBillingAddress.city",
                    customerBillingPinCode: "$customerBillingAddress.pinCode",
                    customer: "$_id",
                    customerCategory: 1,
                    customerShippingAddress: 1,
                    categoryType: 1
                }
            }
        ]);
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
        const billFromLocationOptions = await filteredCompanyList([
            {
                $match: {
                    _id: ObjectId(req.user.company)
                }
            },
            {$unwind: "$placesOfBusiness"},
            {$group: {_id: null, locationIDs: {$addToSet: "$placesOfBusiness.locationID"}}},
            {
                $unwind: "$locationIDs"
            },
            {$project: {_id: 0, label: "$locationIDs", value: "$locationIDs"}}
        ]);
        const paymentTermsOptions = await getAllPaymentTerms(req.user.company);
        let salesCategory = await getAllCustomerCategory(req.user.company);

        let companyData = await getCompanyById(req.user.company, {placesOfBusiness: 1});
        return res.success({
            autoIncrementedValues,
            companyData,
            customersOptions,
            billToOptions,
            paymentTermsOptions: paymentTermsOptions.map(x => {
                return {
                    label: x.paymentDescription,
                    value: x.paymentDescription
                };
            }),
            billFromLocationOptions: billFromLocationOptions,
            transporterOptions: [...logisticOptions, ...transporterOptions],
            freightTermsOptions,
            modeOfTransportOptions,
            salesCategoryOptions: salesCategory.map(x => {
                return {
                    category: x?.category,
                    categoryType: x?.categoryType
                };
            })
        });
    } catch (error) {
        console.error("getAllMasterData Direct Tax Invoice", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getDTIDetailsByCustomerId = asyncHandler(async (req, res) => {
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
                                hsnCode: 1,
                                igst: "$igstRate",
                                cgst: "$cgstRate",
                                sgst: "$sgstRate",
                                ugst: "$ugstRate"
                            }
                        }
                    ],
                    as: "salesHSN"
                }
            },
            {$unwind: "$salesHSN"},
            {
                $project: {
                    salesInvoiceLineNumber: {$literal: 0},
                    SONumber: {$literal: 0},
                    SOId: ObjectId("000000000000000000000000"),
                    SPLineNumber: {$literal: 0},
                    batchId: ObjectId("000000000000000000000000"),
                    batchDate: new Date(),
                    tBatchNo: "-",
                    SKU: "$_id",
                    SKUNo: "$SKUNo",
                    SKUName: "$SKUName",
                    SKUDescription: "$SKUDescription",
                    dispatchQty: {$literal: 0},
                    invoicedQty: {$literal: 0},
                    discount: {$literal: 0},
                    purchaseRate: "$customerInfo.standardSellingRate",
                    unit: "$primaryUnit",
                    salesInvoiceUnitRate: {$literal: 0},
                    salesInvoiceLineValue: {$literal: 0},
                    HSN: "$salesHSN._id",
                    HSNCode: "$salesHSN.hsnCode",
                    igst: "$salesHSN.igst",
                    cgst: "$salesHSN.cgst",
                    sgst: "$salesHSN.sgst",
                    ugst: "$salesHSN.ugst",
                    IgstAmt: {$literal: 0},
                    CgstAmt: {$literal: 0},
                    SgstAmt: {$literal: 0}
                }
            }
        ]);
        return res.success(SKUList);
    } catch (error) {
        console.error("getAllDTIMasterData SalesInvoice", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
