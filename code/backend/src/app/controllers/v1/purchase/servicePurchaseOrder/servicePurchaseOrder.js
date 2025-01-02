const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/purchase/servicePurchaseOrderModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllSuppliers} = require("../suppliers/suppliers");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {default: mongoose} = require("mongoose");
const {getCompanyLocations} = require("../../settings/company/company");
const {CONSTANTS} = require("../../../../../config/config");
const {
    getAllServicePurchaseOrderAttributes,
    getAllServicePurchaseOrderExcelAttributes,
    getAllServicePurchaseOrderReportsAttributes
} = require("../../../../models/purchase/helpers/servicePurchaseOrderHelper");
const {getSACObj} = require("../SAC/SAC");
const {OTHER_CHARGES_SAC_CODE, COMPANY_DEPARTMENTS, SALES_CATEGORY} = require("../../../../mocks/constantData");
const {getEndDateTime, getStartDateTime, dateToAnyFormat} = require("../../../../helpers/dateTime");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {SERVICE_PURCHASE_ORDER} = require("../../../../mocks/schemasConstant/purchaseConstant");
const {filteredServiceMasterList} = require("../../../../models/purchase/repository/serviceMasterRepository");
const {filteredSupplierList} = require("../../../../models/purchase/repository/supplierRepository");
const SPORepository = require("../../../../models/purchase/repository/servicePurchaseOrderRepository");
const SupplierRepository = require("../../../../models/purchase/repository/supplierRepository");
const {getAllPurchaseCategory} = require("../../settings/purchaseCategoryMaster/purchaseCategoryMaster");
const {getAutoIncrementNumber, checkDomesticCustomer} = require("../../../../helpers/utility");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");

const ObjectId = mongoose.Types.ObjectId;
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllServicePurchaseOrderAttributes();
        if (req.query.excel == "true") {
            project = getAllServicePurchaseOrderExcelAttributes();
        }
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    SPOStatus: {$nin: ["Report Generated", "Rejected", "Closed"]}
                }
            },
            {
                $addFields: {
                    SPODateS: {$dateToString: {format: "%d-%m-%Y", date: "$SPODate"}},
                    netSPOValue: {$toString: "$netSPOValue"}
                }
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                supplierName: 1,
                                _id: 1
                                // supplierCurrency: 1,
                                // supplierINCOTerms: 1,
                                // supplierPurchaseType: 1,
                                // supplierGST: 1,
                            }
                        }
                    ],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"}
        ];
        let rows = await SPORepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        console.error("getAll Service Purchase Order", e);
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
                message: MESSAGES.apiSuccessStrings.ADDED("Service Purchase Order")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Service Purchase Order", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    update ServicePurchaseOrder  Record
// @route   PUT /purchase/servicePurchaseOrder/update/:id
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await SPORepository.getDocById(req.params.id, {_id: 1});
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        await SPORepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: `Service Purchase has been ${
                itemDetails.SPOStatus == "Awaiting Approval" ? "updated" : itemDetails.SPOStatus.toLowerCase()
            } successfully`
        });
    } catch (e) {
        console.error("update Service Purchase Order", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    deleteById ServicePurchaseOrder Record
// @route   PUT /purchase/servicePurchaseOrder/delete/:id
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("ServicePurchaseOrder")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Service Purchase Order");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Service Purchase Order", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getById ServicePurchaseOrder Record
// @route   GET /purchase/servicePurchaseOrder/getById/:id
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id)
            .populate("supplier")
            .populate("SPODetails.serviceMaster", "sacCode")
            .populate({
                path: "company",
                model: "Company",
                select: {
                    contactInfo: 1,
                    placesOfBusiness: 1,
                    companyName: 1,
                    GSTIN: 1,
                    companyContactPersonEmail: 1,
                    companyAddress: 1,
                    companyContactPersonNumber: 1,
                    companyContactPersonAltNum: 1,
                    swiftCode: 1,
                    companyBankMICRCode: 1,
                    intermediaryBank: 1,
                    intermediaryBankSwiftCode: 1,
                    logoUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$logo"]},
                    companySignatureUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$companySignature"]},
                    companyPdfHeaderUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$companyPdfHeader"]}
                }
            })
            .lean();
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("ServicePurchaseOrder");
            return res.unprocessableEntity(errors);
        }
        if (existing.company.placesOfBusiness.length > 0) {
            for (const e of existing.company.placesOfBusiness) {
                if (e.locationID == existing.deliveryLocation) {
                    existing.company.GSTIN = e.GSTINForAdditionalPlace;
                    existing.company.companyAddress = e;
                }
                if (e.locationID == existing.deliveryLocation) {
                    existing.company.GSTIN = e.GSTINForAdditionalPlace;
                    existing.company.companyAddress = e;
                }
            }
        }
        if (existing.company.contactInfo.length > 0) {
            existing.company.contactInfo = existing.company.contactInfo.find(
                x => x.department == COMPANY_DEPARTMENTS.PURCHASE
            );
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById ServicePurchaseOrder", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getAllMasterData ServicePurchaseOrder Record
// @route   GET /purchase/servicePurchaseOrder/getAllMasterData
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        // const autoIncrementNo = await getAndSetAutoIncrementNo(
        //     {...SERVICE_PURCHASE_ORDER.AUTO_INCREMENT_DATA()},
        //     req.user.company
        // );
        const purchaseCategoryList = await getAllPurchaseCategory(req.user.company, null);
        let autoIncValues = {};
        let purchaseCategoryOptions;
        if (purchaseCategoryList.length > 0) {
            for (const ele of purchaseCategoryList) {
                autoIncValues[ele.category] = getAutoIncrementNumber(ele.prefix, "", ele.nextAutoIncrement, ele.digit);
            }
            purchaseCategoryOptions = purchaseCategoryList.map(x => {
                return {
                    label: x.category,
                    value: x.category,
                    categoryType: x.categoryType
                };
            });
        } else {
            const autoIncrementedNo = await getAndSetAutoIncrementNo(
                {...SERVICE_PURCHASE_ORDER.AUTO_INCREMENT_DATA()},
                req.user.company
            );
            purchaseCategoryOptions = await getAllModuleMaster(req.user.company, "PURCHASE_TYPE");
            purchaseCategoryOptions = await Promise.all(
                purchaseCategoryOptions?.map(async x => {
                    const isDomestic = await checkDomesticCustomer(x.value);
                    return {
                        label: x.label,
                        value: x.value,
                        categoryType: isDomestic ? SALES_CATEGORY.DOMESTIC : SALES_CATEGORY.IMPORTS
                    };
                })
            );
            for (const ele of purchaseCategoryOptions) {
                autoIncValues[ele.label] = autoIncrementedNo;
            }
        }
        const serviceMasters = await filteredServiceMasterList([
            {$match: {company: ObjectId(req.user.company), isActive: "Y"}},
            {$sort: {serviceCode: -1}},
            {
                $project: {
                    _id: 1,
                    serviceCode: 1,
                    serviceDescription: 1,
                    purchaseRate: 1,
                    gst: 1,
                    igst: 1,
                    sgst: 1,
                    cgst: 1,
                    ugst: 1
                }
            }
        ]);
        // const suppliersOptions = await filteredSupplierList([
        //     {$match: {company: ObjectId(req.user.company), isSupplierActive: "A"}},
        //     {$sort: {supplierName: 1}},
        //     {
        //         $addFields: {
        //             supplierBillingAddress: {$arrayElemAt: ["$supplierBillingAddress", 0]}
        //         }
        //     },
        //     {
        //         $project: {
        //             label: "$supplierName",
        //             value: "$_id",
        //             supplierCurrency: "$supplierCurrency",
        //             supplierPurchaseType: "$supplierPurchaseType",
        //             categoryType: "$categoryType",
        //             supplierCode: 1,
        //             supplierBillingState: "$supplierBillingAddress.state",
        //             supplierBillingCity: "$supplierBillingAddress.city",
        //             supplierBillingPinCode: "$supplierBillingAddress.pinCode"
        //         }
        //     }
        // ]);
        // const purchaseTypes = await findAppParameterValue("PURCHASE_TYPE", req.user.company);
        const locationOptions = await getCompanyLocations(req.user.company);
        return res.success({
            autoIncValues,
            purchaseCategoryOptions,
            serviceMasters,
            locationOptions: locationOptions?.split(",")?.map(x => {
                return {
                    label: x,
                    value: x
                };
            })
            // purchaseCategories: purchaseTypes?.split(",")?.map(x => {
            //     return {
            //         label: x,
            //         value: x
            //     };
            // })
        });
    } catch (error) {
        console.error("getAllMasterData ServicePurchaseOrder", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getSPOSupplierByCategory = asyncHandler(async (req, res) => {
    try {
        let {purchaseCategory = SALES_CATEGORY.DOMESTIC} = req.query;
        let supplierList = await SupplierRepository.filteredSupplierList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isSupplierActive: "A",
                    categoryType: purchaseCategory
                }
            },
            {$sort: {supplierName: 1}},
            {
                $addFields: {
                    supplierBillingAddress: {$arrayElemAt: ["$supplierBillingAddress", 0]}
                }
            },
            {
                $lookup: {
                    from: "PurchaseOrder",
                    localField: "_id",
                    foreignField: "supplier",
                    pipeline: [{$sort: {PODate: -1}}, {$limit: 1}, {$project: {transporter: 1}}],
                    as: "lastSupplier"
                }
            },
            {
                $unwind: {
                    path: "$lastSupplier",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    label: "$supplierName",
                    value: "$_id",
                    supplierCode: 1,
                    supplierPurchaseType: 1,
                    supplierCurrency: 1,
                    categoryType: 1,
                    referenceModel: "Supplier",
                    supplierBillingState: "$supplierBillingAddress.state",
                    supplierBillingCity: "$supplierBillingAddress.city",
                    supplierBillingPinCode: "$supplierBillingAddress.pinCode",
                    supplierPaymentTerms: 1,
                    lastTransporter: "$lastSupplier.transporter"
                }
            }
        ]);

        return res.success(supplierList);
    } catch (error) {
        console.error("getSupplierByCategory", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const suppliers = await getAllSuppliers(req.user.company, {supplierName: 1});
        const {supplier = null, toDate = null, fromDate = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!supplier && {
                supplier: ObjectId(supplier)
            }),
            ...(!!toDate &&
                !!fromDate && {
                    SPODate: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                }),
            SPOStatus: {$in: ["Report Generated", "Closed", "Rejected"]}
        };
        let SACObj = await getSACObj(OTHER_CHARGES_SAC_CODE);
        let project = getAllServicePurchaseOrderReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $addFields: {
                    SPODateS: {$dateToString: {format: "%d-%m-%Y", date: "$SPODate"}}
                }
            },
            {
                $lookup: {
                    from: "Supplier",
                    localField: "supplier",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                supplierName: 1,
                                supplierCurrency: 1,
                                supplierGST: 1
                            }
                        }
                    ],
                    as: "supplier"
                }
            },
            {$unwind: "$supplier"},
            {
                $lookup: {
                    from: "Company",
                    localField: "company",
                    foreignField: "_id",
                    let: {deliveryLocation: "$deliveryLocation"},
                    pipeline: [
                        {$unwind: "$placesOfBusiness"},
                        {$match: {$expr: {$eq: ["$$deliveryLocation", "$placesOfBusiness.locationID"]}}},
                        {$project: {_id: 0, GSTINForAdditionalPlace: "$placesOfBusiness.GSTINForAdditionalPlace"}}
                    ],
                    as: "company"
                }
            },
            {$unwind: "$company"},
            {
                $addFields: {
                    locationCond: {
                        $cond: [{$eq: ["$company.GSTINForAdditionalPlace", "supplier.supplierGST"]}, true, false]
                    }
                }
            },
            {
                $addFields: {
                    GSTAmount: {
                        $divide: [
                            {
                                $reduce: {
                                    input: "$SPODetails",
                                    initialValue: 0,
                                    in: {
                                        $sum: [
                                            "$$value",
                                            {
                                                $sum: [
                                                    {
                                                        $cond: [
                                                            {$eq: ["$locationCond", true]},
                                                            [
                                                                {$multiply: ["$$this.sgst", "$$this.lineValue"]},
                                                                {$multiply: ["$$this.cgst", "$$this.lineValue"]}
                                                            ],
                                                            {$multiply: ["$$this.igst", "$$this.lineValue"]}
                                                        ]
                                                    },
                                                    {
                                                        $cond: [
                                                            {$gt: ["$otherCharges.totalAmount", 0]},
                                                            {
                                                                $cond: [
                                                                    {$eq: ["$locationCond", true]},
                                                                    [
                                                                        {
                                                                            $multiply: [
                                                                                SACObj?.sgstRate,
                                                                                "$otherCharges.totalAmount"
                                                                            ]
                                                                        },
                                                                        {
                                                                            $multiply: [
                                                                                SACObj?.cgstRate,
                                                                                "$otherCharges.totalAmount"
                                                                            ]
                                                                        }
                                                                    ],
                                                                    {
                                                                        $multiply: [
                                                                            SACObj?.igstRate,
                                                                            "$otherCharges.totalAmount"
                                                                        ]
                                                                    }
                                                                ]
                                                            },
                                                            0
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                }
                            },
                            100
                        ]
                    }
                }
            }
        ];
        let rows = await SPORepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        GSTAmount: {$sum: {$toDouble: "$GSTAmount"}},
                        netSPOValue: {$sum: {$toDouble: "$netSPOValue"}},
                        totalAmountWithTax: {$sum: {$toDouble: "$totalAmountWithTax"}}
                    }
                },
                {
                    $project: {
                        GSTAmount: {$round: ["$GSTAmount", 2]},
                        netSPOValue: {$round: ["$netSPOValue", 2]},
                        totalAmountWithTax: {$round: ["$totalAmountWithTax", 2]}
                    }
                }
            ]
        });
        return res.success({suppliers, ...rows});
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

 

exports.getTotalNoOfServicePurchaseOrderPerDay = async company => {
    const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
    const rows = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$SPODate"}}
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
                totalServicePurchaseOrders: {$sum: 1},
                totalServicePOValue: {$sum: "$netSPOValue"}
            }
        },
        {
            $project: {
                _id: 0,
                totalServicePurchaseOrders: 1,
                totalServicePOValue: {$round: ["$totalServicePOValue", 2]}
            }
        }
    ]);
    let obj = {
        totalServicePurchaseOrders: rows[0]?.totalServicePurchaseOrders || 0,
        totalServicePOValue: rows[0]?.totalServicePOValue || 0
    };
    return obj;
};
