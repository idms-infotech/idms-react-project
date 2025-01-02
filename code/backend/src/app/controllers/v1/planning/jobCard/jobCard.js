const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {
    getAllJobCardAttributes,
    getAllJobCardReportAttributes
} = require("../../../../models/planning/helpers/jobCardHelper");
const {JOB_CARD_STAGE, JOB_ORDER_TYPE, COMPANY_TYPE} = require("../../../../mocks/constantData");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {getAllProspectsFiltered} = require("../../businessLeads/prospect/prospect");
const {getAllCustomersFiltered} = require("../../sales/customerMaster/customerMaster");
const {getAllSObyCustomerIdForJobCard, updateSOQtyOnJCC} = require("../../sales/salesOrder/salesOrder");
const {getAllSFbyCustomerIdForJobCard, updateSFQtyOnJCC} = require("../../sales/sales-forecast/sales-forecast");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {JOB_CARD_CREATION} = require("../../../../mocks/schemasConstant/planningConstant");
const JobCardRepository = require("../../../../models/planning/repository/jobCardRepository");
const BOMOfSKURepository = require("../../../../models/planning/repository/BOMRepository/BoMOfSKURepository");
const BOMOfDSKURepository = require("../../../../models/businessLeads/repository/BOMOfDSKURepository");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const {filteredProspectList} = require("../../../../models/businessLeads/repository/prospectMasterRepository");
const {getEndDateTime} = require("../../../../helpers/dateTime");
const {getCompanyById} = require("../../settings/company/company");
const {getAllSRbyCustomerIdForJobCard, updateSRQtyOnJCC} = require("../../businessLeads/sampleRequest/sampleRequest");
const {filteredStockPreparationList} = require("../../../../models/planning/repository/stockPreparationRepository");
const SKUMasterRepository = require("../../../../models/sales/repository/SKUMasterRepository");
const CompanyRepository = require("../../../../models/settings/repository/companyRepository");
const {getAllCustomerCategory} = require("../../settings/customerCategory/customerCategory");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        const {orderType = null} = req.query;
        let project = getAllJobCardAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: {$nin: [OPTIONS.defaultStatus.REPORT_GENERATED, OPTIONS.defaultStatus.CLOSED]},
                    ...(!!orderType && {orderType: orderType})
                    // $or: [
                    //     {status: {$ne: OPTIONS.defaultStatus.REPORT_GENERATED}},
                    //     {
                    //         $and: [
                    //             {status: OPTIONS.defaultStatus.REPORT_GENERATED},
                    //             {
                    //                 updatedAt: {
                    //                     $gte: new Date(new Date() - 3 * 60 * 60 * 24 * 1000)
                    //                 }
                    //             }
                    //         ]
                    //     }
                    // ]
                }
            },
            {$unwind: {path: "$DSKUDetails", preserveNullAndEmptyArrays: true}},
            {$unwind: {path: "$SKUDetails", preserveNullAndEmptyArrays: true}},
            {
                $lookup: {
                    from: "Customer",
                    let: {fieldId: "$reference"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$fieldId"]
                                }
                            }
                        },
                        {
                            $project: {
                                customerName: {
                                    $cond: [
                                        {$or: [{$eq: ["$customerNickName", ""]}, {$not: ["$customerNickName"]}]},
                                        "$customerName",
                                        "$customerNickName"
                                    ]
                                }
                            }
                        }
                    ],
                    as: "customers"
                }
            },
            {
                $unwind: {
                    path: "$customers",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "Prospect",
                    let: {fieldId: "$reference"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$fieldId"]
                                }
                            }
                        },
                        {$project: {prospectName: 1}}
                    ],
                    as: "prospects"
                }
            },
            {
                $unwind: {
                    path: "$prospects",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    jobCardNo: 1,
                    jobCardDate: {$dateToString: {format: "%d-%m-%Y", date: "$jobCardDate"}},
                    customerNickName: {
                        $cond: [
                            {$eq: ["$referenceModel", "Customer"]},
                            "$customers.customerName",
                            "$prospects.prospectName"
                        ]
                    },
                    SKUNo: {$cond: [{$not: ["$DSKUDetails.DSKUNo"]}, "$SKUDetails.SKUNo", "$DSKUDetails.DSKUNo"]},
                    SKUName: {
                        $cond: [{$not: ["$DSKUDetails.DSKUName"]}, "$SKUDetails.SKUName", "$DSKUDetails.DSKUName"]
                    },
                    SKUDescription: {
                        $cond: [
                            {$not: ["$DSKUDetails.DSKUDescription"]},
                            "$SKUDetails.SKUDescription",
                            "$DSKUDetails.DSKUDescription"
                        ]
                    },
                    UOM: {
                        $cond: [{$not: ["$DSKUDetails.UOM"]}, "$SKUDetails.UOM", "$DSKUDetails.UOM"]
                    },
                    batchQty: {
                        $cond: [{$not: ["$DSKUDetails.batchQty"]}, "$SKUDetails.batchQty", "$DSKUDetails.batchQty"]
                    },
                    status: 1
                }
            },
            {
                $group: {
                    _id: {jobCardNoId: "$_id", SKUNo: "$SKUNo"},
                    batchQty: {$sum: "$batchQty"},
                    jobCardNo: {$first: "$jobCardNo"},
                    updatedAt: {$first: "$updatedAt"},
                    jobCardDate: {$first: "$jobCardDate"},
                    orderType: {$first: "$orderType"},
                    customerNickName: {$first: "$customerNickName"},
                    SKUName: {$first: "$SKUName"},
                    SKUDescription: {$first: "$SKUDescription"},
                    UOM: {$first: "$UOM"},
                    status: {$first: "$status"}
                }
            }
        ];
        let rows = await JobCardRepository.getAllPaginate({
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
        const itemDetails = await JobCardRepository.createDoc(createdObj);
        for (const ele of itemDetails.SKUDetails) {
            if (ele.referenceModel == "SalesOrder") {
                await updateSOQtyOnJCC(
                    req.user.sub,
                    ele.reference.valueOf(),
                    ele.SKU.valueOf(),
                    ele.batchQty,
                    itemDetails.status,
                    ele.lineNumber
                );
            } else if (ele.referenceModel == "SalesForecast") {
                await updateSFQtyOnJCC(
                    req.user.sub,
                    ele.reference.valueOf(),
                    ele.SKU.valueOf(),
                    ele.batchQty,
                    itemDetails.status,
                    ele.lineNumber
                );
            } else if (ele.referenceModel == "SampleRequest") {
                await updateSRQtyOnJCC(
                    req.user.sub,
                    ele.reference.valueOf(),
                    ele.SKU.valueOf(),
                    ele.batchQty,
                    itemDetails.status,
                    ele.lineNumber
                );
            }
        }
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Job Card")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Job Card ", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await JobCardRepository.getDocById(req.params.id, {_id: 1});
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await JobCardRepository.updateDoc(itemDetails, req.body);
        if (itemDetails && itemDetails.SKUDetails) {
            for (const ele of itemDetails?.SKUDetails) {
                if (ele.referenceModel == "SalesOrder") {
                    await updateSOQtyOnJCC(
                        req.user.sub,
                        ele.reference.valueOf(),
                        ele.SKU.valueOf(),
                        ele.batchQty,
                        itemDetails.status,
                        ele.lineNumber
                    );
                } else if (ele.referenceModel == "SalesForecast") {
                    await updateSFQtyOnJCC(
                        req.user.sub,
                        ele.reference.valueOf(),
                        ele.SKU.valueOf(),
                        ele.batchQty,
                        itemDetails.status,
                        ele.lineNumber
                    );
                } else if (ele.referenceModel == "SampleRequest") {
                    await updateSRQtyOnJCC(
                        req.user.sub,
                        ele.reference.valueOf(),
                        ele.SKU.valueOf(),
                        ele.batchQty,
                        itemDetails.status,
                        ele.lineNumber
                    );
                }
            }
        }

        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Job Card has been")
        });
    } catch (e) {
        console.error("update Job Card ", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await JobCardRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Job Card")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Job Card");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Job Card", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await JobCardRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Job Card");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Job Card", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getDimBySKU = asyncHandler(async (req, res) => {
    try {
        let result = await SKUMasterRepository.getDocById(req.params.id, {
            dimensionsDetails: 1
        });
        return res.success(result);
    } catch (error) {
        console.error("getDimBySKU Job Card", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getByIdForPDF = asyncHandler(async (req, res) => {
    try {
        let rows = await JobCardRepository.filteredJobCardList([
            {
                $match: {
                    _id: ObjectId(req.params.id)
                }
            },
            {
                $addFields: {
                    JCDetails: {
                        $concatArrays: [
                            "$SKUDetails",
                            {
                                $map: {
                                    input: "$DSKUDetails",
                                    as: "details",
                                    in: {
                                        SO_FCNumber: "$$details.NPDNo",
                                        SKU: "$$details.DSKU",
                                        SKUNo: "$$details.DSKUNo",
                                        SKUName: "$$details.DSKUName",
                                        SKUDescription: "$$details.DSKUDescription",
                                        UOM: "$$details.UOM"
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            {
                $unwind: {
                    path: "$JCDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: "$JCDetails.SKU",
                    SONo: {
                        $push: "$JCDetails.SO_FCNumber"
                    },
                    company: {$first: "$company"},
                    jobCardNo: {$first: "$jobCardNo"},
                    jobCardDate: {$first: "$jobCardDate"},
                    batchDate: {$first: "$batchInfo.manufacturingDate"},
                    totalBatchQuantity: {$first: "$batchInfo.totalBatchQuantity"},
                    customerCategory: {$first: "$customerCategory"},
                    stage: {$first: "$stage"},
                    NPDInput: {$first: "$NPDInput"},
                    customerName: {$first: "$customerName"},
                    reference: {$first: "$reference"},
                    referenceModel: {$first: "$referenceModel"},
                    orderType: {$first: "$orderType"},
                    dispatchSchedule: {$first: {$first: "$JCDetails.dispatchSchedule"}},
                    UOM: {$first: "$JCDetails.UOM"}
                }
            },
            {
                $lookup: {
                    from: "SKUMaster",
                    let: {fieldId: "$reference"},
                    localField: "_id",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                SKUNo: 1,
                                SKUName: 1,
                                artWorkNo: 1,
                                actualDimensionsUnit: "$dimensionsDetails.actualDimensions.unit",
                                actualDimensionsWidth: "$dimensionsDetails.actualDimensions.width",
                                actualDimensionsLength: "$dimensionsDetails.actualDimensions.length",
                                actualDimensionsUps: "$dimensionsDetails.actualDimensions.ups",
                                layoutDimensionsUnit: "$dimensionsDetails.layoutDimensions.unit",
                                layoutDimensionsWidth: "$dimensionsDetails.layoutDimensions.width",
                                layoutDimensionsLength: "$dimensionsDetails.layoutDimensions.length",
                                layoutDimensionsUps: "$dimensionsDetails.layoutDimensions.ups",
                                totalNoOfColors: 1,
                                productCategory: 1,
                                customerInfo: {
                                    $filter: {
                                        input: "$customerInfo",
                                        as: "info",
                                        cond: {$eq: ["$$info.customer", "$$fieldId"]}
                                    }
                                }
                            }
                        },
                        {
                            $addFields: {customerInfo: {$first: "$customerInfo"}}
                        }
                    ],
                    as: "SKU"
                }
            },
            {
                $lookup: {
                    from: "NPDMaster",
                    let: {fieldId: "$reference"},
                    localField: "_id",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                SKUNo: 1,
                                SKUName: 1,
                                artWorkNo: 1,
                                actualDimensionsUnit: "$dimensionsDetails.actualDimensions.unit",
                                actualDimensionsWidth: "$dimensionsDetails.actualDimensions.width",
                                actualDimensionsLength: "$dimensionsDetails.actualDimensions.length",
                                actualDimensionsUps: "$dimensionsDetails.actualDimensions.ups",
                                layoutDimensionsUnit: "$dimensionsDetails.layoutDimensions.unit",
                                layoutDimensionsWidth: "$dimensionsDetails.layoutDimensions.width",
                                layoutDimensionsLength: "$dimensionsDetails.layoutDimensions.length",
                                layoutDimensionsUps: "$dimensionsDetails.layoutDimensions.ups",
                                totalNoOfColors: 1,
                                productCategory: 1,
                                customerInfo: {
                                    $filter: {
                                        input: "$customerInfo",
                                        as: "info",
                                        cond: {$eq: ["$$info.reference", "$$fieldId"]}
                                    }
                                }
                            }
                        },
                        {
                            $addFields: {customerInfo: {$first: "$customerInfo"}}
                        }
                    ],
                    as: "DSKU"
                }
            },
            {
                $addFields: {
                    SKU: {
                        $concatArrays: ["$SKU", "$DSKU"]
                    }
                }
            },
            {
                $unwind: {
                    path: "$SKU",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    jobCardNo: 1,
                    jobCardDate: {$dateToString: {format: "%d-%m-%Y", date: "$jobCardDate"}},
                    productCategory: "$SKU.productCategory",
                    customerName: 1,
                    SKUNo: "$SKU.SKUNo",
                    SKUName: "$SKU.SKUName",
                    stage: 1,
                    drawing: 1,
                    customerPartNo: "$SKU.customerInfo.customerPartNo",
                    UOM: 1,
                    totalBatchQuantity: 1,
                    manufacturingDate: "$batchInfo.manufacturingDate",
                    SONo: 1,
                    company: 1,
                    batchDate: 1,
                    NPDInput: 1,
                    reference: 1,
                    referenceModel: 1,
                    orderType: 1,
                    dispatchSchedule: 1,
                    SKU: "$SKU._id",
                    actualDimensionsUnit: "$SKU.actualDimensionsUnit",
                    actualDimensionsWidth: "$SKU.actualDimensionsWidth",
                    actualDimensionsLength: "$SKU.actualDimensionsLength",
                    actualDimensionsUps: "$SKU.actualDimensionsUps",
                    layoutDimensionsUnit: "$SKU.layoutDimensionsUnit",
                    layoutDimensionsWidth: "$SKU.layoutDimensionsWidth",
                    layoutDimensionsLength: "$SKU.layoutDimensionsLength",
                    layoutDimensionsUps: "$SKU.layoutDimensionsUps",
                    totalNoOfColors: "$SKU.totalNoOfColors",
                    artWorkNo: "$SKU.artWorkNo"
                }
            }
        ]);
        let jobCard = rows.length > 0 ? rows[0] : {};
        let type = [JOB_ORDER_TYPE.SO, JOB_ORDER_TYPE.FC, JOB_ORDER_TYPE.ALL].includes(jobCard.orderType)
            ? "SKU"
            : "DSKU";
        let MRPData = await this.getBOMBySKUOrDSKUData(type, jobCard.SKU, jobCard.company);
        MRPData = MRPData.map(x => {
            x.partCount = (+x.partCount * +jobCard.totalBatchQuantity).toFixed(2);
            return x;
        });
        const PPICToProdGoodsList = await filteredStockPreparationList([
            {
                $match: {
                    jobCard: ObjectId(req.params.id),
                    company: ObjectId(req.user.company)
                }
            },
            {
                $unwind: {
                    path: "$stockPreparationDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 0,
                    itemCode: "$stockPreparationDetails.itemCode",
                    itemName: "$stockPreparationDetails.itemName",
                    itemDescription: "$stockPreparationDetails.itemDescription",
                    UOM: "$stockPreparationDetails.UOM",
                    issueQty: "$stockPreparationDetails.GTQty"
                }
            }
        ]);
        return res.success({jobCard, MRPData, PPICToProdGoodsList});
    } catch (e) {
        console.error("getById Job Card", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let salesCategory = await getAllCustomerCategory(req.user.company);
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            JOB_CARD_CREATION.AUTO_INCREMENT_DATA(),
            req.user.company
        );
        const companyData = await getCompanyById(req.user.company, {_id: 0, companyType: 1});
        const NPDInputs = await getAllModuleMaster(req.user.company, "NPD_INPUT");
        return res.success({
            stages: JOB_CARD_STAGE.getStages(),
            orderTypes: JOB_ORDER_TYPE.getOrders(),
            autoIncrementNo,
            NPDInputs,
            companyType: companyData?.companyType,
            salesCategoryOptions: salesCategory.map(x => {
                return {
                    category: x?.category,
                    categoryType: x?.categoryType
                };
            })
        });
    } catch (error) {
        console.error("getAllMasterData Job Card", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getCustomersByCategory = asyncHandler(async (req, res) => {
    try {
        let customerList = await getAllCustomersFiltered({
            company: req.user.company,
            customerCategory: req.query.category
        });
        if (req.query.stage == JOB_CARD_STAGE.PROTOTYPE) {
            let prospectList = await getAllProspectsFiltered({
                company: req.user.company,
                customerCategory: req.query.category
            });
            for (let i = 0; i < prospectList.length; i++) {
                const ele = prospectList[i];
                customerList.push(ele);
            }
        }
        return res.success(customerList);
    } catch (error) {
        console.error("getAllMasterData Job Card", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getJCDetailsByCustomerId = asyncHandler(async (req, res) => {
    try {
        const {orderType = null, customerId = null, stage = null} = req.query;
        let result = [];
        // let jobCardList = [];
        if (orderType == JOB_ORDER_TYPE.NPD && stage == JOB_CARD_STAGE.PROTOTYPE) {
            // result = await getAllDSKUByCustomerForJobCard(customerId, req.user.company);
            // jobCardList = await JobCardRepository.filteredJobCardList([
            //     {
            //         $match: {
            //             reference: ObjectId(customerId),
            //             company: ObjectId(req.user.company),
            //             orderType: JOB_ORDER_TYPE.NPD,
            //             status: {$in: [OPTIONS.defaultStatus.REPORT_GENERATED]}
            //         }
            //     },
            //     {$unwind: "$DSKUDetails"},
            //     {
            //         $group: {
            //             _id: "$DSKUDetails.DSKU",
            //             reqQty: {$sum: "$DSKUDetails.batchQty"}
            //         }
            //     }
            // ]);
            // if (jobCardList && jobCardList.length) {
            //     const jobCardMap = new Map(jobCardList.map(job => [job._id.valueOf(), job]));
            //     result = result.reduce((acc, x) => {
            //         const job = jobCardMap.get(x.DSKU.valueOf());
            //         if (job && job.reqQty < x.balQty) {
            //             x.balQty = x.balQty - job.reqQty;
            //             if (x.balQty > 0) {
            //                 acc.push(x);
            //             }
            //         }
            //         return acc;
            //     }, []);
            // }
            result = await getAllSRbyCustomerIdForJobCard(customerId, req.user.company);
        }
        if ([JOB_ORDER_TYPE.ALL, JOB_ORDER_TYPE.SO].includes(orderType)) {
            result = await getAllSObyCustomerIdForJobCard(customerId, req.user.company);
        }
        if ([JOB_ORDER_TYPE.ALL, JOB_ORDER_TYPE.FC].includes(orderType)) {
            let FCResult = await getAllSFbyCustomerIdForJobCard(customerId, req.user.company);
            result = [...result, ...FCResult];
        }
        return res.success(result);
    } catch (error) {
        console.error("getAllMasterData Job Card", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllJobTrackingMasterData = asyncHandler(async (req, res) => {
    try {
        const companyData = await CompanyRepository.getDocById(req.user.company, {
            companyType: 1
        });
        let lookupCollection =
            companyData?.companyType == COMPANY_TYPE.CONTROL_PANEL
                ? {
                      from: "JCEntry",
                      let: {jobCard: "$jobCard", skuId: "$SKU._id"},
                      pipeline: [
                          {
                              $match: {
                                  $expr: {
                                      $and: [{$eq: ["$jobCard", "$$jobCard"]}, {$eq: ["$SKU", "$$skuId"]}]
                                  },
                                  status: OPTIONS.defaultStatus.IN_PROGRESS_DASH
                              }
                          },
                          {
                              $project: {
                                  jobCardEntryId: "$_id",
                                  batchOutputQty: "$totalBatchQuantity",
                                  productionEntry: {
                                      $map: {
                                          input: "$JCEntryDetails",
                                          as: "details",
                                          in: {
                                              seq: "$$details.seq",
                                              processName: "$$details.processName",
                                              processStatus: "$$details.processStatus"
                                          }
                                      }
                                  }
                              }
                          }
                      ],
                      as: "jobCardEntry"
                  }
                : {
                      from: "JobCardEntry",
                      let: {jobCard: "$jobCard", skuId: "$SKU._id"},
                      pipeline: [
                          {
                              $match: {
                                  $expr: {
                                      $and: [{$eq: ["$jobCard", "$$jobCard"]}, {$eq: ["$SKU", "$$skuId"]}]
                                  },
                                  "generateReport.checkoutStatus": {
                                      $in: [OPTIONS.defaultStatus.IN_PROGRESS_DASH]
                                  }
                              }
                          },
                          {
                              $project: {
                                  jobCardEntryId: "$_id",
                                  batchOutputQty: "$generateReport.batchOutputQty",
                                  productionEntry: {
                                      $map: {
                                          input: "$productionEntry",
                                          as: "details",
                                          in: {
                                              seq: "$$details.seq",
                                              processName: "$$details.processName",
                                              processStatus: "$$details.processStatus"
                                          }
                                      }
                                  }
                              }
                          }
                      ],
                      as: "jobCardEntry"
                  };
        const jobTrackingData = await JobCardRepository.filteredJobCardList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: {$in: [OPTIONS.defaultStatus.REPORT_GENERATED]}
                }
            },
            {
                $addFields: {
                    JCDetails: {
                        $concatArrays: [
                            "$SKUDetails",
                            {
                                $map: {
                                    input: "$DSKUDetails",
                                    as: "details",
                                    in: {
                                        SKU: "$$details.DSKU",
                                        SKUNo: "$$details.DSKUNo",
                                        UOM: "$$details.UOM"
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            {
                $unwind: {
                    path: "$JCDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: "$JCDetails.SKU",
                    jobCard: {$first: "$_id"},
                    jobCardNo: {$first: "$jobCardNo"},
                    jobCardDate: {$first: "$jobCardDate"},
                    batchDate: {$first: "$batchInfo.manufacturingDate"},
                    totalBatchQuantity: {$first: "$batchInfo.totalBatchQuantity"},
                    customerName: {$first: "$customerName"},
                    reference: {$first: "$reference"},
                    referenceModel: {$first: "$referenceModel"},
                    UOM: {$first: "$JCDetails.UOM"}
                }
            },
            {
                $lookup: {
                    from: "Customer",
                    let: {fieldId: "$reference"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$fieldId"]
                                }
                            }
                        },
                        {$project: {customerName: {$ifNull: ["$customerNickName", "$customerName"]}}}
                    ],
                    as: "customers"
                }
            },
            {
                $unwind: {
                    path: "$customers",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "Prospect",
                    let: {fieldId: "$reference"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$fieldId"]
                                }
                            }
                        },
                        {$project: {prospectName: 1}}
                    ],
                    as: "prospects"
                }
            },
            {
                $unwind: {
                    path: "$prospects",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "SKUMaster",
                    let: {fieldId: "$reference"},
                    localField: "_id",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                SKUNo: 1,
                                SKUName: 1,
                                layoutDimensionsUnit: "$dimensionsDetails.layoutDimensions.unit",
                                layoutDimensionsWidth: "$dimensionsDetails.layoutDimensions.width",
                                layoutDimensionsLength: "$dimensionsDetails.layoutDimensions.length",
                                layoutDimensionsUps: "$dimensionsDetails.layoutDimensions.ups",
                                totalNoOfColors: 1
                            }
                        }
                    ],
                    as: "SKU"
                }
            },
            {
                $lookup: {
                    from: "NPDMaster",
                    let: {fieldId: "$reference"},
                    localField: "_id",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                SKUNo: 1,
                                layoutDimensionsUnit: "$dimensionsDetails.layoutDimensions.unit",
                                layoutDimensionsWidth: "$dimensionsDetails.layoutDimensions.width",
                                layoutDimensionsLength: "$dimensionsDetails.layoutDimensions.length",
                                layoutDimensionsUps: "$dimensionsDetails.layoutDimensions.ups",
                                totalNoOfColors: 1
                            }
                        }
                    ],
                    as: "DSKU"
                }
            },
            {
                $addFields: {
                    SKU: {
                        $concatArrays: ["$SKU", "$DSKU"]
                    }
                }
            },
            {
                $unwind: {
                    path: "$SKU",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: lookupCollection
            },
            {
                $unwind: "$jobCardEntry"
            },
            {$sort: {jobCardDate: 1}},
            {
                $project: {
                    _id: 0,
                    jobCardNo: 1,
                    jobCardId: "$jobCard",
                    jobCardEntryId: "$jobCardEntry.jobCardEntryId",
                    jobCardDate: {$dateToString: {format: "%d-%m-%Y", date: "$jobCardDate"}},
                    customerName: {
                        $cond: [
                            {$eq: ["$referenceModel", "Prospect"]},
                            "$prospects.prospectName",
                            "$customers.customerName"
                        ]
                    },

                    SKUId: "$SKU._id",
                    SKUNo: "$SKU.SKUNo",
                    SKUName: "$SKU.SKUName",
                    UOM: 1,
                    totalBatchQuantity: 1,
                    manufacturingDate: "$batchInfo.manufacturingDate",
                    batchDate: {$dateToString: {format: "%d-%m-%Y", date: "$batchDate"}},
                    layoutDimensionsUnit: "$SKU.layoutDimensionsUnit",
                    layoutDimensionsWidth: "$SKU.layoutDimensionsWidth",
                    layoutDimensionsLength: "$SKU.layoutDimensionsLength",
                    layoutDimensionsUps: "$SKU.layoutDimensionsUps",
                    totalNoOfColors: "$SKU.totalNoOfColors",
                    batchOutputQty: "$jobCardEntry.batchOutputQty",
                    jobCardEntry: "$jobCardEntry.productionEntry"
                }
            }
        ]);
        return res.success({jobTrackingData, companyData});
    } catch (error) {
        console.error("getAllMasterData Job Card", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const {customerId = null, toDate = null} = req.query;
        let project = getAllJobCardReportAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    ...(!!customerId && {reference: ObjectId(customerId)}),
                    ...(!!toDate && {
                        jobCardDate: {
                            $lte: getEndDateTime(toDate)
                        }
                    }),
                    status: {$in: [OPTIONS.defaultStatus.REPORT_GENERATED, OPTIONS.defaultStatus.APPROVED]}
                }
            },
            {$unwind: {path: "$DSKUDetails", preserveNullAndEmptyArrays: true}},
            {$unwind: {path: "$SKUDetails", preserveNullAndEmptyArrays: true}},
            {
                $lookup: {
                    from: "Customer",
                    let: {fieldId: "$reference"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$fieldId"]
                                }
                            }
                        },
                        {
                            $project: {
                                customerName: {
                                    $cond: [
                                        {$or: [{$eq: ["$customerNickName", ""]}, {$not: ["$customerNickName"]}]},
                                        "$customerName",
                                        "$customerNickName"
                                    ]
                                }
                            }
                        }
                    ],
                    as: "customers"
                }
            },
            {
                $unwind: {
                    path: "$customers",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "Prospect",
                    let: {fieldId: "$reference"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$fieldId"]
                                }
                            }
                        },
                        {$project: {prospectName: 1}}
                    ],
                    as: "prospects"
                }
            },
            {
                $unwind: {
                    path: "$prospects",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    jobCardNo: 1,
                    orderType: 1,
                    jobCardDate: {$dateToString: {format: "%d-%m-%Y", date: "$jobCardDate"}},
                    customerNickName: {
                        $cond: [
                            {$eq: ["$referenceModel", "Customer"]},
                            "$customers.customerName",
                            "$prospects.prospectName"
                        ]
                    },
                    SKUNo: {$cond: [{$not: ["$DSKUDetails.DSKUNo"]}, "$SKUDetails.SKUNo", "$DSKUDetails.DSKUNo"]},
                    SKUName: {
                        $cond: [{$not: ["$DSKUDetails.DSKUName"]}, "$SKUDetails.SKUName", "$DSKUDetails.DSKUName"]
                    },
                    SKUDescription: {
                        $cond: [
                            {$not: ["$DSKUDetails.DSKUDescription"]},
                            "$SKUDetails.SKUDescription",
                            "$DSKUDetails.DSKUDescription"
                        ]
                    },
                    UOM: {
                        $cond: [{$not: ["$DSKUDetails.UOM"]}, "$SKUDetails.UOM", "$DSKUDetails.UOM"]
                    },
                    batchQty: {
                        $cond: [{$not: ["$DSKUDetails.batchQty"]}, "$SKUDetails.batchQty", "$DSKUDetails.batchQty"]
                    },
                    status: 1
                }
            },
            {
                $group: {
                    _id: {jobCardNoId: "$_id", SKUNo: "$SKUNo"},
                    batchQty: {$sum: "$batchQty"},
                    jobCardNo: {$first: "$jobCardNo"},
                    updatedAt: {$first: "$updatedAt"},
                    jobCardDate: {$first: "$jobCardDate"},
                    orderType: {$first: "$orderType"},
                    customerNickName: {$first: "$customerNickName"},
                    SKUName: {$first: "$SKUName"},
                    SKUDescription: {$first: "$SKUDescription"},
                    UOM: {$first: "$UOM"},
                    status: {$first: "$status"}
                }
            }
        ];
        const prospects = await filteredProspectList([
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE,
                    company: ObjectId(req.user.company)
                }
            },
            {$sort: {prospectName: 1}},
            {
                $project: {
                    label: "$prospectName"
                }
            }
        ]);
        const customers = await filteredCustomerList([
            {
                $match: {
                    isCustomerActive: "A",
                    company: ObjectId(req.user.company)
                }
            },
            {$sort: {customerName: 1}},
            {
                $project: {
                    label: "$customerName"
                }
            }
        ]);
        for (let i = 0; i < prospects.length; i++) {
            const ele = prospects[i];
            customers.push(ele);
        }
        let rows = await JobCardRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({...rows, customerOptions: customers});
    } catch (e) {
        console.error("getAllReportJobCard", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getBOMBySKUOrDSKU = asyncHandler(async (req, res) => {
    try {
        let result = await this.getBOMBySKUOrDSKUData(req.query.type, req.query.SKUOrDSKUId, req.user.company);
        return res.success(result);
    } catch (error) {
        console.error("getBOMBySKUOrDSKU Job Card", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getBOMBySKUOrDSKUData = async (type, SKUOrDSKUId, company) => {
    let result = [];
    if (type == "SKU") {
        result = await BOMOfSKURepository.filteredBoMOfSKUList([
            {
                $match: {
                    SKU: ObjectId(SKUOrDSKUId),
                    status: OPTIONS.defaultStatus.ACTIVE,
                    company: ObjectId(company)
                }
            },
            {
                $unwind: "$BOMOfSKUDetails"
            },
            {
                $project: {
                    itemCode: "$BOMOfSKUDetails.itemCode",
                    itemName: "$BOMOfSKUDetails.itemName",
                    itemDescription: "$BOMOfSKUDetails.itemDescription",
                    UOM: "$BOMOfSKUDetails.UOM",
                    partCount: {
                        $round: [{$divide: ["$BOMOfSKUDetails.partCount", "$partCount"]}, 5]
                    }
                }
            }
        ]);
    } else {
        result = await BOMOfDSKURepository.filteredBOMOfDSKUList([
            {
                $match: {
                    SKU: ObjectId(SKUOrDSKUId),
                    status: OPTIONS.defaultStatus.ACTIVE,
                    company: ObjectId(company)
                }
            },
            {
                $unwind: "$BOMOfSKUDetails"
            },
            {
                $project: {
                    itemCode: "$BOMOfSKUDetails.itemCode",
                    itemName: "$BOMOfSKUDetails.itemName",
                    itemDescription: "$BOMOfSKUDetails.itemDescription",
                    UOM: "$BOMOfSKUDetails.UOM",
                    partCount: {$round: [{$divide: ["$BOMOfSKUDetails.partCount", "$partCount"]}, 5]}
                }
            }
        ]);
    }
    return result;
};
