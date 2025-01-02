const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllSampleJCCreationAttributes,
    getAllSampleJCReportsAttributes
} = require("../../../../models/businessLeads/helpers/sampleJCCreationHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {SAMPLE_JC_CREATION} = require("../../../../mocks/schemasConstant/businessLeadsConstant");
const SampleJCCreationRepository = require("../../../../models/businessLeads/repository/sampleJCCreationRepository");
const {ObjectId} = require("../../../../../config/mongoose");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {getAllCustomersFiltered} = require("../../sales/customerMaster/customerMaster");
const {filteredSampleRequestList} = require("../../../../models/businessLeads/repository/sampleRequestRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const {getCompanyById} = require("../../settings/company/company");
const {filteredBoMOfSKUList} = require("../../../../models/planning/repository/BOMRepository/BoMOfSKURepository");
const {filteredCustomerList} = require("../../../../models/sales/repository/customerRepository");
const {getEndDateTime} = require("../../../../helpers/dateTime");
const {getAllCustomerCategory} = require("../../settings/customerCategory/customerCategory");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllSampleJCCreationAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company), status: {$nin: [OPTIONS.defaultStatus.REPORT_GENERATED]}}},
            {$unwind: {path: "$SKUDetails", preserveNullAndEmptyArrays: true}},
            {
                $lookup: {
                    from: "Customer",
                    let: {fieldId: "$customer"},
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
            }
        ];
        let rows = await SampleJCCreationRepository.getAllPaginate({
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
        const itemDetails = await SampleJCCreationRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Sample JC Creation")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Sample JC Creation", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await SampleJCCreationRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await SampleJCCreationRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Sample JC Creation has been")
        });
    } catch (e) {
        console.error("update Sample JC Creation", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await SampleJCCreationRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Sample JC Creation")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Sample JC Creation");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Sample JC Creation", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await SampleJCCreationRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Sample JC Creation");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Sample JC Creation", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            SAMPLE_JC_CREATION.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
        let salesCategory = await getAllCustomerCategory(req.user.company);
        const companyData = await getCompanyById(req.user.company, {_id: 0, companyType: 1});
        const NPDInputs = await getAllModuleMaster(req.user.company, "NPD_INPUT");
        return res.success({
            autoIncrementNo,
            NPDInputs,
            companyType: companyData?.companyType,
            salesCategory: salesCategory.map(x => {
                return {
                    category: x?.category,
                    categoryType: x?.categoryType
                };
            })
        });
    } catch (error) {
        console.error("getAllMasterData Sample JC Creation", error);
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
        return res.success(customerList);
    } catch (error) {
        console.error("getAllMasterData Sample JC Creation", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getSampleJCDetailsByCustomerId = asyncHandler(async (req, res) => {
    try {
        const {customerId = null} = req.query;
        let result = await filteredSampleRequestList([
            {
                $match: {
                    customer: ObjectId(customerId),
                    company: ObjectId(req.user.company),
                    "SRDetails.balancedQty": {$gt: 0},
                    SRStatus: {
                        $in: [OPTIONS.defaultStatus.APPROVED, OPTIONS.defaultStatus.REPORT_GENERATED]
                    }
                }
            },
            {
                $unwind: "$SRDetails"
            },
            {
                $lookup: {
                    from: "FGIN",
                    localField: "SRDetails.SKU",
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
                    localField: "SRDetails.SKU",
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
                    sampleRequest: "$_id",
                    SO_FCNumber: "$sampleReqNo",
                    SO_FCDate: "$SRDate",
                    code: {$ifNull: ["$mapCategory.colourName", "#fa0096"]},
                    SKU: "$SKU._id",
                    SKUNo: "$SKU.SKUNo",
                    SKUName: "$SKU.SKUName",
                    SKUDescription: "$SKU.SKUDescription",
                    drawing: "$SKU.drawing",
                    UOM: "$SKU.primaryUnit",
                    internalPartNo: "$SKU.internalPartNo",
                    balQty: {$ifNull: ["$SRDetails.balancedQty", 0]},
                    totalFGQty: {
                        $reduce: {
                            input: "$inventory",
                            initialValue: 0,
                            in: {$add: ["$$value", "$$this.FGQty"]}
                        }
                    },
                    batchQty: {$literal: 0},
                    FGInventoryInfo: "$inventory",
                    dispatchSchedule: {
                        $cond: {
                            if: {
                                $and: [
                                    {$ne: [{$type: "$SRDetails.dispatchSchedule"}, "missing"]},
                                    {$gt: [{$size: {$ifNull: ["$SRDetails.dispatchSchedule", []]}}, 0]}
                                ]
                            },
                            then: "$SRDetails.dispatchSchedule",
                            else: [
                                {
                                    scheduleNo: 1,
                                    quantity: "$SRDetails.orderedQty",
                                    dispatchDate: "$SRDetails.SRLineTargetDate"
                                }
                            ]
                        }
                    },
                    SO_FCLineTargetDate: "$SRDetails.SRLineTargetDate"
                }
            }
        ]);
        return res.success(result);
    } catch (error) {
        console.error("getAllMasterData Sample JC Creation", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getBOMBySKUId = asyncHandler(async (req, res) => {
    try {
        let result = await this.BOMBySKUIdData(req.query.SKUId, req.user.company);
        return res.success(result);
    } catch (error) {
        console.error("getBOMBySKUOrDSKU Sample JC Creation", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.BOMBySKUIdData = async (SKUId, company) =>
    filteredBoMOfSKUList([
        {
            $match: {
                SKU: ObjectId(SKUId),
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
exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const {customerId = null, toDate = null} = req.query;
        let project = getAllSampleJCReportsAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    ...(!!customerId && {customer: ObjectId(customerId)}),
                    ...(!!toDate && {
                        jobCardDate: {
                            $lte: getEndDateTime(toDate)
                        }
                    }),
                    status: {$in: [OPTIONS.defaultStatus.REPORT_GENERATED, OPTIONS.defaultStatus.APPROVED]}
                }
            },
            {$unwind: {path: "$SKUDetails", preserveNullAndEmptyArrays: true}},
            {
                $lookup: {
                    from: "Customer",
                    let: {fieldId: "$customer"},
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
                $project: {
                    jobCardNo: 1,
                    orderType: 1,
                    jobCardDate: {$dateToString: {format: "%d-%m-%Y", date: "$jobCardDate"}},
                    customerNickName: "$customers.customerName",
                    SKUNo: "$SKUDetails.SKUNo",
                    SKUName: "$SKUDetails.SKUName",
                    SKUDescription: "$SKUDetails.SKUDescription",
                    UOM: "$SKUDetails.UOM",
                    batchQty: "$SKUDetails.batchQty",
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
        let rows = await SampleJCCreationRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({...rows, customerOptions: customers});
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getByIdForPDF = asyncHandler(async (req, res) => {
    try {
        let rows = await SampleJCCreationRepository.filteredSampleJCCreationList([
            {
                $match: {
                    _id: ObjectId(req.params.id)
                }
            },

            {
                $unwind: {
                    path: "$SKUDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: "$SKUDetails.SKU",
                    SONo: {
                        $push: "$SKUDetails.SO_FCNumber"
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
                    customer: {$first: "$customer"},
                    orderType: {$first: "$orderType"},
                    dispatchSchedule: {$first: {$first: "$SKUDetails.dispatchSchedule"}},
                    UOM: {$first: "$SKUDetails.UOM"}
                }
            },
            {
                $lookup: {
                    from: "SKUMaster",
                    let: {fieldId: "$customer"},
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
                    customer: 1,
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
        let MRPData = await this.BOMBySKUIdData(jobCard.SKU, jobCard.company);
        MRPData = MRPData.map(x => {
            x.partCount = (+x.partCount * +jobCard.totalBatchQuantity).toFixed(2);
            return x;
        });
        return res.success({jobCard, MRPData});
    } catch (e) {
        console.error("getById ", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
