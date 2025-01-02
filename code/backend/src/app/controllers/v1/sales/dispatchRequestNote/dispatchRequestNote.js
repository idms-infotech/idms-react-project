const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/sales/dispatchRequestNoteModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {getAllSObyCustomerID, updateSOQtyOnDRN} = require("../salesOrder/salesOrder");
const {getFGINBySKUId, updateFGINQtyOnDRN} = require("../../stores/finishedGoodsInwardEntry/finishedGoodsInwardEntry");
const {getDateDiff, dateToAnyFormat, getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const {getAllPaymentTerms} = require("../paymentTerms/paymentTerms");
const {
    getAllDispatchRequestNoteAttributes,
    getAllDRNSummaryReportAttributes,
    getAllReportAttributes
} = require("../../../../models/sales/helpers/dispatchRequestNoteHelper");
const {DISPATCH_REQUEST_NOTE} = require("../../../../mocks/schemasConstant/salesConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const DRNRepository = require("../../../../models/sales/repository/dispatchRequestNoteRepository");
const ShipmentPlanningRepository = require("../../../../models/dispatch/repository/shipmentPlanningRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {getAllTransporter} = require("../transporter/transporter");
const {getAllCustomers} = require("../customerMaster/customerMaster");
const SORepository = require("../../../../models/sales/repository/salesOrderRepository");
const {getAllCustomerCategory} = require("../../settings/customerCategory/customerCategory");
const {filteredLogisticsProviderList} = require("../../../../models/planning/repository/logisticsProviderRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllDispatchRequestNoteAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    DRNStatus: {$nin: ["Closed", "Cancelled", OPTIONS.defaultStatus.REJECTED]}
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
                    pipeline: [{$project: {customerName: 1}}],
                    as: "customer"
                }
            },
            {$unwind: "$customer"}
        ];
        let rows = await DRNRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllForCancel = asyncHandler(async (req, res) => {
    try {
        let project = getAllDispatchRequestNoteAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company), DRNStatus: OPTIONS.defaultStatus.APPROVED}},
            {
                $addFields: {
                    DRNDateS: {$dateToString: {format: "%d-%m-%Y", date: "$DRNDate"}}
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
                    pipeline: [{$project: {customerName: 1}}],
                    as: "customer"
                }
            },
            {$unwind: "$customer"}
        ];
        let rows = await DRNRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllForCancel", e);
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
            for await (let n of itemDetails.DRNDetails) {
                await updateSOQtyOnDRN(
                    req.user.sub,
                    n.SOId.valueOf(),
                    n.SKU.valueOf(),
                    n.dispatchQty,
                    itemDetails.DRNStatus,
                    n.DRNLineNumber
                );
                for await (const ele of n.FGStockDetails) {
                    await updateFGINQtyOnDRN(
                        req.user.sub,
                        ele.FGINId.valueOf(),
                        ele.dispatchQty,
                        itemDetails.DRNStatus
                    );
                }
                await updateFGINQtyOnDRN(req.user.sub, n.FGINId, n.dispatchQty, itemDetails.DRNStatus);
            }
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("DRN")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create DRN", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @route   PUT /sales/DRN/update/:id
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await DRNRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await DRNRepository.updateDoc(itemDetails, req.body);
        if (itemDetails && itemDetails.DRNStatus == OPTIONS.defaultStatus.CANCELLED) {
            await rejectShipmentPlanningByDRNId(itemDetails._id);
        }
        for (let n of itemDetails.DRNDetails) {
            await updateSOQtyOnDRN(
                req.user.sub,
                n.SOId.valueOf(),
                n.SKU.valueOf(),
                n.dispatchQty,
                itemDetails.DRNStatus,
                n.DRNLineNumber
            );
            for (const ele of n.FGStockDetails) {
                await updateFGINQtyOnDRN(req.user.sub, ele.FGINId.valueOf(), ele.dispatchQty, itemDetails.DRNStatus);
            }
        }
        res.success({
            message: `DRN has been ${
                itemDetails.DRNStatus == "Created" ? "updated" : itemDetails.DRNStatus.toLowerCase()
            } successfully`
        });
    } catch (e) {
        console.error("update DRN", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
const rejectShipmentPlanningByDRNId = async DRNId => {
    try {
        await ShipmentPlanningRepository.updateManyDoc({DRNId: DRNId}, {SPStatus: OPTIONS.defaultStatus.REJECTED});
    } catch (error) {
        console.error("rejectShipmentPlanning DRN", error);
    }
};

// @route   PUT /sales/DRN/delete/:id
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await DRNRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("DRN")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("DRN");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById DRN", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @route   GET /sales/DRN/getById/:id
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id).populate("customer", "customerName customerCategory");
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("DRN");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById DRN", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.DRNDetailsByCustomerId = asyncHandler(async (req, res) => {
    try {
        let salesOrder = await getAllSObyCustomerID(req.params.id, req.user.company);
        let DRNDetails = [];
        if (salesOrder.length > 0) {
            let SOData = await SORepository.getDocById(salesOrder[0]._id, {
                customerBillingAddress: 1,
                customerShippingAddress: 1,
                billFromAddress: 1,
                billFromLocation: 1,
                modeOfTransport: 1,
                frightTerms: 1,
                transporter: 1,
                destination: 1,
                paymentTerms: 1
            });
            const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
            let index = 1;
            for await (const ele of salesOrder) {
                let data = await getFGINBySKUId(ele.SODetails.SKU._id);
                DRNDetails.push({
                    FGINOptions: data,
                    FGStockDetails: data.map(x => {
                        x.isChecked = false;
                        x.dispatchQty = 0;
                        x.aging = "green";
                        let dateDiff = getDateDiff(x.expiryDate, currentDate, "days");
                        if (x.expiryDate) {
                            x.expiryDate = dateToAnyFormat(x.expiryDate, "YYYY-MM-DD");
                            if (+dateDiff < 0) {
                                x.aging = "red";
                            } else if (+dateDiff > 0 && +dateDiff < 30) {
                                x.aging = "orange";
                            } else {
                                x.aging = "green";
                            }
                        }
                        return x;
                    }),
                    DRNLineNumber: !!ele.SOType ? ele?.SODetails?.SOLineNumber : 1,
                    plannedDispatchDt: ele?.SODetails?.SOLineTargetDate,
                    SOId: ele?._id,
                    SONumber: ele?.SONumber,
                    currency: ele?.currency,
                    SODate: ele?.SODate,
                    SKU: ele?.SODetails?.SKU?._id,
                    UOM: ele?.SODetails?.UOM,
                    standardRate: ele?.SODetails?.standardRate,
                    netRate: ele?.SODetails?.netRate,
                    SKUNo: ele?.SODetails?.SKU?.SKUNo,
                    SKUName: ele?.SODetails?.SKU?.SKUName,
                    SKUDescription: ele?.SODetails?.SKU?.SKUDescription,
                    FGINId: null,
                    FGINMfgDate: null,
                    FGINQty: 0,
                    dispatchQty: 0,
                    SOBalancedQty: ele?.SODetails?.balancedQty,
                    invoicedQty: 0,
                    canceledQty: 0,
                    canceledReason: null
                });
                index++;
            }

            return res.success({
                DRNDetails,
                SOData
            });
        }

        return res.success({DRNDetails});
    } catch (e) {
        console.error("getById DRN", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @route   GET /sales/DRN/getAllMasterData
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...DISPATCH_REQUEST_NOTE.AUTO_INCREMENT_DATA()},
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
                    categoryType: 1,
                    customerCategory: 1,
                    customerPaymentTerms: 1,
                    customerCurrency: 1,
                    customerShippingAddress: 1
                }
            }
        ]);
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
        const paymentTermsOptions = await getAllPaymentTerms(req.user.company);
        return res.success({
            autoIncrementNo,
            customersOptions,
            salesCategoryOptions: salesCategory.map(x => {
                return {
                    category: x?.category,
                    categoryType: x?.categoryType
                };
            }),
            paymentTermsOptions: paymentTermsOptions.map(x => {
                return {
                    label: x.paymentDescription,
                    value: x.paymentDescription
                };
            }),
            transporterOptions: [...logisticOptions, ...transporterOptions],
            freightTermsOptions,
            modeOfTransportOptions,
        });
    } catch (error) {
        console.error("getAllMasterData DRN", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

const getAllData = asyncHandler(async (req, query, excel) => {
    try {
        const {page = 1, pageSize = 10, column = "createdAt", direction = -1} = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let rows = [];
        if (excel == "false") {
            rows = await Model.aggregate([
                {$match: query},
                {
                    $lookup: {
                        from: "Customer",
                        localField: "customer",
                        foreignField: "_id",
                        as: "customerDetails"
                    }
                },
                {
                    $lookup: {
                        from: "SKUMaster",
                        localField: "SODetails.SKU",
                        foreignField: "_id",
                        as: "SKU"
                    }
                },
                {
                    $project: {
                        "SODetails.SOLineNumber": 1,
                        "SODetails.balancedQty": 1,
                        "SODetails.SOLineTargetDate": 1,
                        "SODetails.lineValue": 1,
                        SONumber: 1,
                        SKU: 1,
                        SODate: 1,
                        PONumber: 1,
                        salesCategory: 1,
                        customerDetails: 1,
                        currency: 1,
                        SOTotalAmount: 1
                    }
                },
                {$sort: {[column]: +direction}},
                {$skip: +skip},
                {$limit: +pageSize}
            ]);
        } else {
            rows = await Model.aggregate([
                {$match: query},
                {
                    $lookup: {
                        from: "Customer",
                        localField: "customer",
                        foreignField: "_id",
                        as: "customerDetails"
                    }
                },
                {
                    $lookup: {
                        from: "SKUMaster",
                        localField: "SODetails.SKU",
                        foreignField: "_id",
                        as: "SKU"
                    }
                },
                {
                    $project: {
                        "SODetails.SOLineNumber": 1,
                        "SODetails.SOLineTargetDate": 1,
                        "SODetails.balancedQty": 1,
                        "SODetails.lineValue": 1,
                        SONumber: 1,
                        SKU: 1,
                        SODate: 1,
                        PONumber: 1,

                        salesCategory: 1,
                        customerDetails: 1,
                        currency: 1,
                        SOTotalAmount: 1
                    }
                },
                {$sort: {[column]: +direction}}
            ]);
        }
        return rows;
    } catch (e) {
        console.error("getAllData SalesOrder", e);
    }
});
exports.getAllDRNs = async company => {
    try {
        let rows = await Model.find({
            DRNStatus: OPTIONS.defaultStatus.APPROVED,
            company: company
        })
            .sort({createdAt: -1})
            .populate("customer", "customerName customerShippingAddress customerCurrency")
            .lean();
        return rows;
    } catch (e) {
        console.error("getAllDrn", e);
    }
};

exports.updateDRNStatusOnSHIP = asyncHandler(async drnId => {
    try {
        let DRN = await Model.findById(drnId);
        DRN.DRNStatus = OPTIONS.defaultStatus.CLOSED;
        await DRN.save();
    } catch (error) {
        console.error("updatePOQtyOnGRN::::: Error in updating Purchase Order ======= ", error);
    }
});

exports.getTotalDispatchedPerDay = async company => {
    const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
    const rows = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$DRNDate"}}
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
                count: {$sum: 1}
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

exports.getAllDRNSummaryReports = asyncHandler(async (req, res) => {
    try {
        const {customer = null, fromDate = null, toDate = null} = req.query;
        let customerList = await getAllCustomers(req.user.company, {customerName: 1, company: 0});
        let project = getAllDRNSummaryReportAttributes();
        let query = {
            company: ObjectId(req.user.company),
            DRNStatus: {
                $in: [OPTIONS.defaultStatus.APPROVED, OPTIONS.defaultStatus.CLOSED]
            },
            ...(!!customer && {
                customer: {$eq: ObjectId(customer)}
            }),
            ...(!!toDate &&
                !!fromDate && {
                    DRNDate: {
                        $lt: getEndDateTime(toDate),
                        $gt: getStartDateTime(fromDate)
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
            {$unwind: "$DRNDetails"}
        ];
        let rows = await DRNRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            customerList,
            ...rows
        });
    } catch (e) {
        console.error("getAllDRNSummaryReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const {customer = null, fromDate = null, toDate = null} = req.query;
        let customerOptions = await filteredCustomerList([
            {
                $match: {
                    isCustomerActive: "A",
                    company: ObjectId(req.user.company)
                }
            },
            {$sort: {customerName: 1}},
            {
                $project: {
                    customerName: 1
                }
            }
        ]);
        let project = getAllReportAttributes();
        let query = {
            company: ObjectId(req.user.company),
            DRNStatus: {
                $in: [OPTIONS.defaultStatus.APPROVED, OPTIONS.defaultStatus.CLOSED]
            },
            ...(!!customer && {
                customer: {$eq: ObjectId(customer)}
            }),
            ...(!!toDate &&
                !!fromDate && {
                    DRNDate: {
                        $lt: getEndDateTime(toDate),
                        $gt: getStartDateTime(fromDate)
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
                    pipeline: [
                        {$project: {customerName: 1, customerBillingAddress: {$first: "$customerBillingAddress"}}}
                    ],
                    as: "customer"
                }
            },
            {$unwind: "$customer"},
            {$unwind: "$DRNDetails"}
        ];
        let rows = await DRNRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            customerOptions,
            ...rows
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
