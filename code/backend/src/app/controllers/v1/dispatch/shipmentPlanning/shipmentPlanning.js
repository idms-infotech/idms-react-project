const Model = require("../../../../models/dispatch/shipmentPlanningModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {getAllDRNs, updateDRNStatusOnSHIP} = require("../../sales/dispatchRequestNote/dispatchRequestNote");
const {
    getFirstDateOfCurrentFiscalYear,
    getLastDateOfCurrentFiscalYear,
    getFiscalMonthsName
} = require("../../../../utilities/utility");
const {getAllCustomers} = require("../../sales/customerMaster/customerMaster");
const {getSalesHSNByCode} = require("../../sales/salesHSN/salesHSN");
const {getCompanyLocations, getCompanyById} = require("../../settings/company/company");
const {getAllPaymentTerms} = require("../../sales/paymentTerms/paymentTerms");
const {
    getAllShipmentPlanningAttributes,
    getAllShipmentPlanningReportsAttributes
} = require("../../../../models/dispatch/helpers/shipmentPlanningHelper");
const {dateToAnyFormat, getSubtractedDate} = require("../../../../helpers/dateTime");
const {LAKH} = require("../../../../mocks/number.constant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {SHIPMENT_PLANNING} = require("../../../../mocks/schemasConstant/dispatchConstant");
const ShipmentPlanningRepository = require("../../../../models/dispatch/repository/shipmentPlanningRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {getAllTransporter} = require("../../sales/transporter/transporter");
const {SALES_CATEGORY} = require("../../../../mocks/constantData");
const {getCustomerDiscount} = require("../../sales/salesOrder/salesOrder");
const {filteredLogisticsProviderList} = require("../../../../models/planning/repository/logisticsProviderRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = async (req, res) => {
    try {
        let project = getAllShipmentPlanningAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    SPStatus: {$nin: ["Closed", OPTIONS.defaultStatus.REJECTED]}
                }
            },
            {
                $addFields: {
                    DRNDateS: {$dateToString: {format: "%d-%m-%Y", date: "$DRNDate"}}
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {customerName: 1, customerCategory: 1}}],
                    as: "customer"
                }
            },
            {$unwind: "$customer"},
            {
                $lookup: {
                    from: "DispatchRequestNote",
                    localField: "DRNId",
                    foreignField: "_id",
                    pipeline: [{$project: {DRNStatus: 1, DRNNumber: 1}}],
                    as: "DRNId"
                }
            },
            {$unwind: "$DRNId"},
            {
                $match: {
                    DRNStatus: {$nin: ["Report Generated", "Closed", "Cancelled", "Rejected"]}
                }
            }
        ];
        let rows = await ShipmentPlanningRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        console.error("getAllSO", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.create = async (req, res) => {
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
                message: MESSAGES.apiSuccessStrings.ADDED("Shipment Planning")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Shipment Planning", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

// @desc    update Shipment Planning  Record
// @route   PUT /sales/SP/update/:id
exports.update = async (req, res) => {
    try {
        let itemDetails = await Model.findById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await generateCreateData(itemDetails, req.body);

        itemDetails = await itemDetails.save();
        if (itemDetails.SPStatus == OPTIONS.defaultStatus.APPROVED) {
            await updateDRNStatusOnSHIP(itemDetails.DRNId.valueOf());
        }
        return res.success({
            message: `Shipment Planning has been ${
                itemDetails.SPStatus == "Awaiting Approval" ? "updated" : itemDetails.SPStatus.toLowerCase()
            } successfully`
        });
    } catch (e) {
        console.error("update Shipment Planning", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

// @desc    deleteById Shipment Planning Record
// @route   PUT /sales/SP/delete/:id
exports.deleteById = async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Shipment Planning")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Shipment Planning");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Shipment Planning", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

// @route   GET /sales/SP/getById/:id
exports.getById = async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id)
            .populate("customer", "customerName")
            .populate("DRNId", "DRNNumber");
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Shipment Planning");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Shipment Planning", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

// @route   GET /sales/SP/getAllMasterData
exports.getAllMasterData = async (req, res) => {
    try {
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
        const billFromLocationOptions = await getCompanyLocations(req.user.company);
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...SHIPMENT_PLANNING.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        let DRNList = await getAllDRNs(req.user.company);
        for await (const ele of DRNList) {
            ele.DRNDetails = ele.DRNDetails.map(x => {
                x.customer = ele?.customer?._id;
                return x;
            });
            ele.DRNDetails = await getCustomerDiscount(ele.DRNDetails, req.user.company);
        }
        let companyData = await getCompanyById(req.user.company, {placesOfBusiness: 1});
        const paymentTermsOptions = await getAllPaymentTerms(req.user.company);
        return res.success({
            autoIncrementNo,
            DRNList,
            companyData,
            paymentTermsOptions: paymentTermsOptions.map(x => {
                return {
                    label: x.paymentDescription,
                    value: x.paymentDescription
                };
            }),
            billFromLocationOptions: billFromLocationOptions?.split(",")?.map(x => {
                return {
                    label: x,
                    value: x
                };
            }),
            transporterOptions: [...logisticOptions, ...transporterOptions],
            freightTermsOptions,
            modeOfTransportOptions
        });
    } catch (error) {
        console.error("getAllMasterData Shipment Planning", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getAllShipmentPlannings = async company => {
    try {
        let rows = await Model.find({
            SPStatus: OPTIONS.defaultStatus.APPROVED,
            company: company,
            DRNDate: {
                $gte: new Date(getSubtractedDate(30, "d"))
            }
        })
            .sort({createdAt: -1})
            .populate("customer", "customerName")
            .populate("DRNId", "DRNNumber");
        return rows;
    } catch (e) {
        console.error("Shipment Planning ", e);
    }
};
exports.getShipmentPlanningById = async id => {
    try {
        let existing = await Model.findById(id).populate("SPDetails.SKU").populate("SPDetails.SOId");
        let arr = [];
        if (existing?.SPDetails.length) {
            existing = JSON.parse(JSON.stringify(existing));
            for await (const x of existing?.SPDetails) {
                let HSN = await getSalesHSNByCode(x.SKU.hsn);
                x.SKU.HSNCode = HSN?.hsnCode;
                x.SKU.HSN = HSN?._id;
                x.SKU.igst = HSN?.igstRate;
                x.SKU.cgst = HSN?.cgstRate;
                x.SKU.sgst = HSN?.sgstRate;
                x.SKU.ugst = HSN?.ugstRate;
                existing.PINumber = x?.SOId?.PINumber;
                existing.PIDate = x?.SOId?.PIDate;
                existing.PONumber = x?.SOId?.PONumber;
                existing.PODate = x?.SOId?.PODate;
                arr.push(x);
            }
            existing.SPDetails = arr;
        }
        return existing;
    } catch (e) {
        console.error("getById Shipment Planning", e);
    }
};
exports.updateShippingStatusOnTaxInvoiceGenerate = async id => {
    try {
        let SP = await Model.findById(id);
        SP.SPStatus = "Closed";
        await SP.save();
    } catch (error) {
        console.error("updateShippingStatusOnTaxInvoiceGenerate::::: ======= ", error);
    }
};

exports.getAllShipmentsCounts = async company => {
    try {
        const result = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$createdAt"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    SPStatus: {$nin: ["Rejected"]},
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalShipments: {$sum: 1},
                    pendingShipments: {$sum: {$cond: [{$eq: ["$SPStatus", "Awaiting Approval"]}, 1, 0]}}
                }
            },
            {
                $project: {
                    _id: 0,
                    totalShipments: 1,
                    pendingShipments: 1
                }
            }
        ]);
        return result.length > 0 ? result[0] : [];
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};
exports.getAllShipmentsValue = async company => {
    try {
        const result = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$createdAt"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    SPStatus: {$nin: ["Awaiting Approval", "Rejected"]},
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
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
                $match: {
                    "customer.categoryType": SALES_CATEGORY.DOMESTIC
                }
            },
            {
                $group: {
                    _id: null,
                    totalShipmentValue: {$sum: "$shipmentValue"}
                }
            },
            {
                $project: {
                    _id: 0,
                    totalShipmentValue: {$round: [{$divide: ["$totalShipmentValue", LAKH]}, 2]}
                }
            }
        ]);
        return result[0]?.totalShipmentValue || 0;
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};

exports.getMonthlyShipmentCountTrend = async company => {
    try {
        let monthlyShipmentCountTrend = {exports: {}, domestic: {}};
        const monthsArray = getFiscalMonthsName();
        let domesticData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let exportsData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let resultDomestics = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$createdAt"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    SPStatus: {$nin: ["Awaiting Approval", "Rejected"]},
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
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
                $match: {
                    "customer.categoryType": SALES_CATEGORY.DOMESTIC
                }
            },
            {
                $group: {
                    _id: {year_month: {$substrCP: ["$createdAt", 0, 7]}},
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {"_id.year_month": 1}
            },
            {
                $project: {
                    _id: 0,
                    count: 1,
                    month_year: {
                        $concat: [
                            {
                                $arrayElemAt: [
                                    monthsArray,
                                    {
                                        $subtract: [{$toInt: {$substrCP: ["$_id.year_month", 5, 2]}}, 4]
                                    }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    data: {$push: {k: "$month_year", v: "$count"}}
                }
            },
            {
                $project: {
                    data: {$arrayToObject: "$data"},
                    _id: 0
                }
            }
        ]);
        if (resultDomestics.length > 0) {
            const propertyNames = Object.keys(resultDomestics[0].data);
            const propertyValues = Object.values(resultDomestics[0].data);
            let n = 0;
            propertyNames.forEach(elem => {
                let index = monthsArray.indexOf(elem);
                domesticData[index] = propertyValues[n].toFixed(2);
                n++;
            });

            monthlyShipmentCountTrend.domestic = {months: monthsArray, orders: domesticData};
        } else {
            monthlyShipmentCountTrend.domestic = {months: monthsArray, orders: []};
        }
        let resultExports = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$createdAt"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    SPStatus: {$nin: ["Awaiting Approval", "Rejected"]},
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
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
                $match: {
                    "customer.categoryType": SALES_CATEGORY.EXPORTS
                }
            },
            {
                $group: {
                    _id: {year_month: {$substrCP: ["$createdAt", 0, 7]}},
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {"_id.year_month": 1}
            },
            {
                $project: {
                    _id: 0,
                    count: 1,
                    month_year: {
                        $concat: [
                            {
                                $arrayElemAt: [
                                    monthsArray,
                                    {
                                        $subtract: [{$toInt: {$substrCP: ["$_id.year_month", 5, 2]}}, 4]
                                    }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    data: {$push: {k: "$month_year", v: "$count"}}
                }
            },
            {
                $project: {
                    data: {$arrayToObject: "$data"},
                    _id: 0
                }
            }
        ]);
        if (resultExports.length > 0) {
            const propertyNames = Object.keys(resultExports[0].data);
            const propertyValues = Object.values(resultExports[0].data);
            let n = 0;
            propertyNames.forEach(elem => {
                let index = monthsArray.indexOf(elem);
                exportsData[index] = propertyValues[n].toFixed(2);
                n++;
            });

            monthlyShipmentCountTrend.exports = {months: monthsArray, orders: exportsData};
        } else {
            monthlyShipmentCountTrend.exports = {months: monthsArray, orders: []};
        }
        return monthlyShipmentCountTrend;
    } catch (error) {
        console.error(error);
    }
};

exports.getTopFiveShipmentCities = async company => {
    try {
        let TopFiveShipmentCities = {exports: {}, domestic: {}};
        const resultDomestics = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$createdAt"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    SPStatus: {$nin: ["Awaiting Approval", "Rejected"]},
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {categoryType: 1, city: "$customerShippingAddress.city"}}],
                    as: "customer"
                }
            },
            {
                $unwind: "$customer"
            },
            {
                $unwind: {path: "$customer.city", preserveNullAndEmptyArrays: true}
            },
            {
                $match: {
                    "customer.categoryType": SALES_CATEGORY.DOMESTIC
                }
            },
            {
                $group: {
                    _id: "$customer.city",
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $project: {
                    city: "$_id",
                    count: 1
                }
            },
            {$sort: {count: -1}},
            {$limit: 5}
        ]);
        if (resultDomestics.length > 0) {
            let shipmentCity = [];
            let shipmentCount = [];
            for (const ele of resultDomestics) {
                shipmentCity.push(ele.city);
                shipmentCount.push(Number(ele.count));
            }
            TopFiveShipmentCities.domestic = {
                City: shipmentCity,
                Count: shipmentCount
            };
        } else {
            TopFiveShipmentCities.domestic = {City: [], Count: []};
        }
        const resultExports = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$createdAt"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    SPStatus: {$nin: ["Awaiting Approval", "Rejected"]},
                    matchDate: {
                        $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                        $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                    }
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {categoryType: 1, city: "$customerShippingAddress.city"}}],
                    as: "customer"
                }
            },
            {
                $unwind: "$customer"
            },
            {
                $unwind: {path: "$customer.city", preserveNullAndEmptyArrays: true}
            },
            {
                $match: {
                    "customer.categoryType": SALES_CATEGORY.EXPORTS
                }
            },
            {
                $group: {
                    _id: "$customer.city",
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $project: {
                    city: "$_id",
                    count: 1
                }
            },
            {$sort: {count: -1}},
            {$limit: 5}
        ]);
        if (resultExports.length > 0) {
            let shipmentCity = [];
            let shipmentCount = [];
            for (const ele of resultExports) {
                shipmentCity.push(ele.city);
                shipmentCount.push(Number(ele.count));
            }
            TopFiveShipmentCities.exports = {
                City: shipmentCity,
                Count: shipmentCount
            };
        } else {
            TopFiveShipmentCities.exports = {City: [], Count: []};
        }
        return TopFiveShipmentCities;
    } catch (error) {}
};

exports.getAllShipmentSummaryReports = async (req, res) => {
    try {
        let customers = await getAllCustomers(req.user.company, {customerName: 1, company: 0});
        const {fromDate = null, toDate = null, customer = null} = req.query;
        let project = getAllShipmentPlanningReportsAttributes();
        let query = {
            company: ObjectId(req.user.company),
            SPStatus: {$nin: ["Awaiting Approval", "Rejected"]},
            ...(!!customer && {
                customer: {$eq: ObjectId(customer)}
            }),
            ...(!!toDate &&
                !!fromDate && {
                    createdAt: {
                        $lt: new Date(toDate),
                        $gt: new Date(fromDate)
                    }
                })
        };
        let pipeline = [
            {
                $match: query
            },
            {
                $addFields: {
                    createdAtS: {$dateToString: {format: "%d-%m-%Y", date: "$createdAt"}}
                }
            },
            {
                $unwind: "$SPDetails"
            },
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                customerName: 1,
                                customerShippingAddress: {$arrayElemAt: ["$customerShippingAddress", 0]}
                            }
                        }
                    ],
                    as: "customer"
                }
            },
            {
                $unwind: {path: "$customer", preserveNullAndEmptyArrays: true}
            }
        ];
        let rows = await ShipmentPlanningRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        shipmentValue: {$sum: {$toDouble: "$shipmentValue"}}
                    }
                },
                {
                    $project: {
                        shipmentValue: {$round: ["$shipmentValue", 2]},
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
        console.error("getAllShipmentSummaryReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
exports.getTotalNoOfShipmentPerDay = async company => {
    const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
    const rows = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$createdAt"}}
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
                count: {$sum: {$cond: [{$eq: ["$SPStatus", OPTIONS.defaultStatus.APPROVED]}, 1, 0]}}
            }
        },
        {
            $project: {
                _id: 0,
                count: 1
            }
        }
    ]);
    return rows[0]?.count || 0;
};
