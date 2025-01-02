const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/sales/salesForecastModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {getAllSKUListByCustomerId, getAllSKUs} = require("../SKU/SKU");
const {getAllCustomers} = require("../customerMaster/customerMaster");
const {getQMSMappingByModuleAndTitle} = require("../../settings/report-qms-mapping/report-qms-mapping");
const {default: mongoose} = require("mongoose");
const {
    getAllSalesForecastAttributes,
    getAllSalesForecastReportsAttributes
} = require("../../../../models/sales/helpers/salesForecastHelper");
const {dateToAnyFormat} = require("../../../../helpers/dateTime");
const {SALES_FORECAST} = require("../../../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const SalesForecastRepository = require("../../../../models/sales/repository/salesForecastRepository");
const {getAllCustomerCategory} = require("../../settings/customerCategory/customerCategory");
const {getCustomerDiscount} = require("../salesOrder/salesOrder");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllSalesForecastAttributes();
        let pipeline = [
            {
                $match: {
                    status: {
                        $nin: [OPTIONS.defaultStatus.REPORT_GENERATED, OPTIONS.defaultStatus.CANCELLED]
                    },
                    company: ObjectId(req.user.company)
                }
            }
        ];
        let rows = await SalesForecastRepository.getAllPaginate({
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
                message: MESSAGES.apiSuccessStrings.ADDED("Sales Forecast")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Sales Forecast", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    update Sales Forecast  Record
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
        res.success({
            message: `Sales Forecast has been ${
                itemDetails.status == "Created" ? "updated" : itemDetails.status.toLowerCase()
            } successfully`
        });
    } catch (e) {
        console.error("update Sales Forecast", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    deleteById Sales Forecast Record
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Sales Forecast")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Sales Forecast");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Sales Forecast", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id).populate(
            "salesForecastDetails.SKU",
            "SKUNo SKUName SKUDescription "
        );
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Sales Forecast");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Sales Forecast", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...SALES_FORECAST.AUTO_INCREMENT_DATA()},
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
                    customerName: 1,
                    customerCode: 1,
                    customerBillingState: "$customerBillingAddress.state",
                    customerBillingCity: "$customerBillingAddress.city",
                    customerBillingPinCode: "$customerBillingAddress.pinCode",
                    customerCategory: 1,
                    customerCurrency: 1,
                    categoryType: 1
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
        console.error("getAllMasterData Sales Forecast", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllSalesSKUList = asyncHandler(async (req, res) => {
    try {
        let SKUList = await getAllSKUListByCustomerId(req.query.customerId, {
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
            rateType: "$customerInfo.rateType",
            sellingRateCommon: "$customerInfo.sellingRateCommon",
            customer: "$customerInfo.customer",
            customerName: "$customerInfo.customerName",
            primaryUnit: 1,
            secondaryUnit: 1,
            primaryToSecondaryConversion: 1,
            secondaryToPrimaryConversion: 1
        });
        SKUList = await getCustomerDiscount(SKUList, req.user.company);
        return res.success({
            SKUList
        });
    } catch (e) {
        console.error("getAllSalesSKUList", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const {customerId = null, SKUId = null, toDate = null, excel = "false"} = req.query;
        let project = getAllSalesForecastReportsAttributes();
        let query = {
            company: ObjectId(req.user.company),
            status: {$in: ["Closed", "Approved", "Report Generated"]},
            ...(!!customerId && {
                customer: ObjectId(customerId)
            }),
            ...(!!toDate && {
                FCDate: {
                    $lte: new Date(toDate)
                }
            })
        };
        let pipeline = [
            {$match: query},
            {$unwind: "$salesForecastDetails"},
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "salesForecastDetails.SKU",
                    foreignField: "_id",
                    pipeline: [{$project: {SKUName: 1, SKUDescription: 1, SKUNo: 1}}],
                    as: "salesForecastDetails.SKU"
                }
            },
            {$unwind: "$salesForecastDetails.SKU"},
            {
                $lookup: {
                    from: "Customer",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [{$project: {customerNickName: 1}}],
                    as: "customer"
                }
            },
            {
                $unwind: "$customer"
            },
            {
                $match: {
                    ...(!!SKUId && {
                        "salesForecastDetails.SKU._id": ObjectId(SKUId)
                    })
                }
            },
            {$unwind: "$salesForecastDetails.releaseSchedule"}
        ];
        let rows = await SalesForecastRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        FCValue: {$sum: {$toDouble: "$lineValue"}},
                        FCQty: {$sum: {$toDouble: "$quantity"}}
                    }
                }
            ]
        });
        let SKUList = await getAllSKUs(req.user.company, {SKUName: 1});
        let customerList = await getAllCustomers(req.user.company, {customerName: 1});
        const display = await getQMSMappingByModuleAndTitle(req.user.company, "Sales", "Sales Forecast");
        return res.success({
            SKUList,
            customerList,
            display,
            ...rows
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllSFbyCustomerIdForJobCard = async (customerId, company) => {
    try {
        let rows = await Model.aggregate([
            {
                $match: {
                    customer: ObjectId(customerId),
                    company: ObjectId(company),
                    status: {
                        $in: [OPTIONS.defaultStatus.APPROVED, OPTIONS.defaultStatus.REPORT_GENERATED]
                    }
                }
            },
            {
                $unwind: "$salesForecastDetails"
            },
            {
                $match: {
                    "salesForecastDetails.balancedQty": {$gt: 0}
                }
            },
            {
                $lookup: {
                    from: "FGIN",
                    localField: "salesForecastDetails.SKU",
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
                    localField: "salesForecastDetails.SKU",
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
                    lineNumber: "$salesForecastDetails.FCLineNumber",
                    reference: "$_id",
                    referenceModel: "SalesForecast",
                    SO_FCNumber: "$FCNo",
                    SO_FCDate: "$FCDate",
                    code: {$ifNull: ["$mapCategory.colourName", "#fa0096"]},
                    SKU: "$SKU._id",
                    SKUNo: "$SKU.SKUNo",
                    SKUName: "$SKU.SKUName",
                    SKUDescription: "$SKU.SKUDescription",
                    drawing: "$SKU.drawing",
                    UOM: "$SKU.primaryUnit",
                    internalPartNo: "$SKU.internalPartNo",
                    balQty: {$ifNull: ["$salesForecastDetails.JCCQty", 0]},
                    totalFGQty: {
                        $reduce: {
                            input: "$inventory",
                            initialValue: 0,
                            in: {$add: ["$$value", "$$this.FGQty"]}
                        }
                    },
                    batchQty: {$literal: 0},
                    FGInventoryInfo: "$inventory",
                    dispatchSchedule: "$salesForecastDetails.releaseSchedule"
                }
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllSFbyCustomerIdForJobCard", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.updateSFQtyOnJCC = async (updatedBy, SFId, updateSKUId, qty, status, lineNumber) => {
    try {
        const salesForecast = await SalesForecastRepository.getDocById(SFId);
        if (salesForecast) {
            const newSFDetails = salesForecast.salesForecastDetails.map(ele => {
                if (
                    [OPTIONS.defaultStatus.CANCELLED].includes(status) &&
                    ele.SKU.toString() === updateSKUId.toString() &&
                    ele.FCLineNumber == lineNumber
                ) {
                    ele.JCCQty = +ele.JCCQty + +qty;
                    ele.previousJCCQty = 0;
                } else if (ele.SKU.toString() === updateSKUId.toString() && ele.FCLineNumber == lineNumber) {
                    ele.JCCQty = +ele.JCCQty + +ele.previousJCCQty - +qty;
                    ele.previousJCCQty = qty;
                }
                return ele;
            });
            salesForecast.updatedBy = updatedBy;
            salesForecast.salesForecastDetails = newSFDetails;
            const updatedNewSFDetails = await salesForecast.save();
            return updatedNewSFDetails;
        }
    } catch (error) {
        console.error("updateSFQtyOnJCC::::: Error in updating Sale Order ======= ", error);
    }
};
