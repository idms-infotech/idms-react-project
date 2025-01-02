const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllJobCardEntryAttributes,
    getAllJobCardEntryRejectAttributes
} = require("../../../../models/production/helpers/jobCardEntryHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {JOB_CARD_ENTRY} = require("../../../../mocks/schemasConstant/productionConstant");
const JobCardEntryRepository = require("../../../../models/production/repository/jobCardEntryRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const {filteredJobCardList} = require("../../../../models/planning/repository/jobCardRepository");
const {filteredDirectCostList} = require("../../../../models/planning/repository/directCostRepository");
const {JOB_ORDER_TYPE} = require("../../../../mocks/constantData");
const {filteredDirectCostDSKUList} = require("../../../../models/businessLeads/repository/directCostDSKURepository");
const {ObjectId} = require("../../../../../config/mongoose");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {getCompanyLocations} = require("../../settings/company/company");
const SKUMasterRepository = require("../../../../models/sales/repository/SKUMasterRepository");
const {getExpiryDate} = require("../../../../helpers/dateTime");
const FGINRepository = require("../../../../models/stores/repository/FGINRepository");
const {filteredSKUProcessFlowList} = require("../../../../models/businessLeads/repository/SKUProcessFlowRepository");
const {filteredStockPreparationList} = require("../../../../models/planning/repository/stockPreparationRepository");
const JobCardRepository = require("../../../../models/planning/repository/jobCardRepository");
const {filteredDefectListConfigList} = require("../../../../models/settings/repository/defectListConfigRepository");
const {filteredProcessListConfigList} = require("../../../../models/settings/repository/processListConfigRepository");
const {filteredProdProcessConfigList} = require("../../../../models/planning/repository/prodProcessConfigRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllJobCardEntryAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company), status: {$ne: OPTIONS.defaultStatus.REPORT_GENERATED}}}
        ];
        let rows = await JobCardEntryRepository.getAllPaginate({
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

exports.createOrUpdate = asyncHandler(async (req, res) => {
    try {
        let existing = await JobCardEntryRepository.findOneDoc({
            jobCard: req.body.jobCard
        });
        if (existing) {
            existing.updatedBy = req.user.sub;
            existing = await JobCardEntryRepository.updateDoc(existing, req.body);
        } else {
            let createdObj = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                ...req.body
            };
            existing = await JobCardEntryRepository.createDoc(createdObj);
        }
        if (existing.generateReport.checkoutStatus == OPTIONS.defaultStatus.MARK_AS_COMPLETED) {
            await JobCardRepository.findAndUpdateDoc(
                {
                    _id: existing.jobCard
                },
                {
                    $set: {status: OPTIONS.defaultStatus.CLOSED}
                }
            );
        }
        if (
            [OPTIONS.defaultStatus.MARK_AS_COMPLETED, OPTIONS.defaultStatus.SKIP_INTEGRATION].includes(
                existing.generateReport.checkoutStatus
            )
        ) {
            await createFGIN(existing._id, req.user);
        }
        res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("Job Card Entry")
        });
    } catch (e) {
        console.error("create Screen Making Log", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

const createFGIN = async (jobCardEntryId, user) => {
    try {
        const jobCardEntryData = await JobCardEntryRepository.getDocById(jobCardEntryId);
        let SKUDetails = await SKUMasterRepository.getDocById(jobCardEntryData.SKU, {shelfLife: 1, customerInfo: 1});
        let fginData = {
            company: jobCardEntryData?.company,
            createdBy: user.sub,
            updatedBy: user.sub,
            FGINNo: "FGIN000",
            FGINDate: new Date(),
            location: jobCardEntryData?.generateReport?.location,
            SKUId: jobCardEntryData?.SKU,
            SKUNo: jobCardEntryData?.SKUNo,
            SKUName: jobCardEntryData?.SKUName,
            SKUDescription: jobCardEntryData?.SKUDescription,
            partNo: SKUDetails?.customerInfo[0]?.customerPartNo,
            UOM: jobCardEntryData?.UOM,
            jobCardNo: jobCardEntryData?.jobCardNo,
            FGINDate: new Date(),
            manufacturingDate: new Date(),
            expiryDate: getExpiryDate(SKUDetails?.shelfLife, new Date()),
            shelfLife: SKUDetails?.shelfLife,
            producedQty: jobCardEntryData?.generateReport?.batchOutputQty,
            FGINQuantity: jobCardEntryData?.generateReport?.batchOutputQty,
            previousDRNQty: 0,
            batchNo: jobCardEntryData?.jobCardNo
        };
        await FGINRepository.createDoc(fginData);
    } catch (error) {
        console.error("error", error);
    }
};

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            JOB_CARD_ENTRY.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
        const JCOptions = await filteredJobCardList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: {$in: [OPTIONS.defaultStatus.REPORT_GENERATED]}
                }
            },
            {
                $lookup: {
                    from: "JobCardEntry",
                    localField: "_id",
                    foreignField: "jobCard",
                    pipeline: [
                        {
                            $match: {
                                "generateReport.checkoutStatus": {
                                    $in: [
                                        OPTIONS.defaultStatus.MARK_AS_COMPLETED,
                                        OPTIONS.defaultStatus.SKIP_INTEGRATION
                                    ]
                                }
                            }
                        }
                    ],
                    as: "jobCardEntry"
                }
            },
            {
                $match: {
                    jobCardEntry: {$size: 0}
                }
            },
            {
                $addFields: {
                    JCDetails: {
                        $concatArrays: [
                            {
                                $map: {
                                    input: "$SKUDetails",
                                    as: "details",
                                    in: {
                                        SKU: "$$details.SKU",
                                        SKUNo: "$$details.SKUNo",
                                        SKUName: "$$details.SKUName",
                                        SKUDescription: "$$details.SKUDescription",
                                        UOM: "$$details.UOM",
                                        batchInfo: "$$details.batchInfo",
                                        referenceModel: "SKUMaster"
                                    }
                                }
                            },
                            {
                                $map: {
                                    input: "$DSKUDetails",
                                    as: "details",
                                    in: {
                                        SKU: "$$details.DSKU",
                                        SKUNo: "$$details.DSKUNo",
                                        SKUName: "$$details.DSKUName",
                                        SKUDescription: "$$details.DSKUDescription",
                                        UOM: "$$details.UOM",
                                        batchQty: "$$details.batchQty",
                                        referenceModel: "NPDMaster"
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
                    _id: {jobCard: "$_id", SKU: "$JCDetails.SKU"},
                    jobCardNo: {$first: "$jobCardNo"},
                    SKUNo: {$first: "$JCDetails.SKUNo"},
                    SKUName: {$first: "$JCDetails.SKUName"},
                    SKUDescription: {$first: "$JCDetails.SKUDescription"},
                    UOM: {$first: "$JCDetails.UOM"},
                    batchQty: {$first: "$batchInfo.totalBatchQuantity"},
                    orderType: {$first: "$orderType"},
                    referenceModel: {$first: "$JCDetails.referenceModel"}
                }
            },
            {
                $project: {
                    _id: "$_id.jobCard",
                    jobCardNo: 1,
                    SKU: "$_id.SKU",
                    SKUNo: 1,
                    SKUName: 1,
                    SKUDescription: 1,
                    UOM: 1,
                    batchQty: 1,
                    orderType: 1,
                    referenceModel: 1
                }
            },
            {
                $sort: {jobCardNo: -1}
            }
        ]);
        // const processMasterOptions = await filteredProcessMasterList([
        //     {
        //         $project: {
        //             _id: 0,
        //             seq: null,
        //             process: "$_id",
        //             processName: 1,
        //             UOM: "$unitProcessOutput",
        //             machineName: {
        //                 $getField: {
        //                     field: "assetName",
        //                     input: {$first: "$assetAllocationDetails"}
        //                 }
        //             },
        //             machine: {
        //                 $getField: {
        //                     field: "asset",
        //                     input: {$first: "$assetAllocationDetails"}
        //                 }
        //             },
        //             machineInfo: {
        //                 $map: {
        //                     input: "$assetAllocationDetails",
        //                     as: "details",
        //                     in: {
        //                         machine: "$$details.asset",
        //                         machineName: "$$details.assetName"
        //                     }
        //                 }
        //             },
        //             production: {
        //                 prodSource: null,
        //                 cumulativeCount: {$literal: 0},
        //                 info: [],
        //                 remarks: null,
        //                 prodAuthorizedBy: null
        //             },
        //             prodQty: {$literal: 0},
        //             IPQA: {
        //                 prodSource: null,
        //                 cumulativeCount: {$literal: 0},
        //                 info: [],
        //                 remarks: null,
        //                 qualityReleaseBy: null
        //             },
        //             releaseQty: {$literal: 0},
        //             processStatus: {$literal: false}
        //         }
        //     }
        // ]);
        const billFromLocationOptions = await getCompanyLocations(req.user.company);
        const shiftOptions = await getAllModuleMaster(req.user.company, "PRODUCTION_SHIFT");
        const defectList = await filteredDefectListConfigList([
            {
                $match: {
                    company: ObjectId(req.user.company)
                }
            },
            {
                $sort: {
                    SN: 1
                }
            },
            {
                $project: {
                    SN: 1,
                    defectName: 1,
                    rejectionType: "$defectName"
                }
            }
        ]);
        return res.success({
            autoIncrementNo,
            JCOptions,
            // processMasterOptions,
            shiftOptions,
            billFromLocationOptions: billFromLocationOptions?.split(",")?.map(x => {
                return {
                    label: x,
                    value: x
                };
            }),
            defectList
        });
    } catch (error) {
        console.error("getAllMasterData Job Card Entry", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getProcessFromDirectCostBySKUId = asyncHandler(async (req, res) => {
    try {
        const pipeline = [
            {
                $project: {
                    directCostDetails: 1
                }
            },
            {
                $unwind: "$directCostDetails"
            },
            {
                $lookup: {
                    from: "ProcessMaster",
                    localField: "directCostDetails.process",
                    foreignField: "_id",
                    pipeline: [{$project: {assetAllocationDetails: 1}}],
                    as: "directCostDetails.process"
                }
            },
            {$unwind: "$directCostDetails.process"},
            {
                $project: {
                    _id: 0,
                    seq: "$directCostDetails.PFSeq",
                    process: "$directCostDetails.process._id",
                    processName: "$directCostDetails.processName",
                    UOM: "$directCostDetails.unitProcessOutput",
                    machineName: {
                        $getField: {
                            field: "assetName",
                            input: {$first: "$directCostDetails.process.assetAllocationDetails"}
                        }
                    },
                    machine: {
                        $getField: {
                            field: "asset",
                            input: {$first: "$directCostDetails.process.assetAllocationDetails"}
                        }
                    },
                    machineInfo: {
                        $map: {
                            input: "$directCostDetails.process.assetAllocationDetails",
                            as: "details",
                            in: {
                                machine: "$$details.asset",
                                machineName: "$$details.assetName"
                            }
                        }
                    },
                    production: {
                        prodSource: null,
                        cumulativeCount: {$literal: 0},
                        info: [],
                        remarks: null,
                        prodAuthorizedBy: null
                    },
                    prodQty: {$literal: 0},
                    IPQA: {
                        prodSource: null,
                        cumulativeCount: {$literal: 0},
                        info: [],
                        remarks: null,
                        qualityReleaseBy: null
                    },
                    releaseQty: {$literal: 0},
                    processStatus: {$literal: false}
                }
            }
        ];
        let processList = [];
        if (req.query.orderType == JOB_ORDER_TYPE.NPD) {
            processList = await filteredDirectCostDSKUList([
                {
                    $match: {
                        company: ObjectId(req.user.company),
                        DSKU: ObjectId(req.query.SKUOrDSKUId)
                    }
                },
                ...pipeline
            ]);
        } else {
            processList = await filteredDirectCostList([
                {
                    $match: {
                        company: ObjectId(req.user.company),
                        SKU: ObjectId(req.query.SKUOrDSKUId)
                    }
                },
                ...pipeline
            ]);
        }
        return res.success(processList);
    } catch (error) {
        console.error("getProcessFromDirectCostBySKUId Job Card Entry", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getJCEntryDataByJobCardId = asyncHandler(async (req, res) => {
    try {
        let jobCardEntryData = [];
        jobCardEntryData = await JobCardEntryRepository.filteredJobCardEntryList([
            {
                $match: {
                    jobCard: ObjectId(req.query.jobCard)
                }
            }
        ]);
        if (jobCardEntryData.length == 0) {
            jobCardEntryData = await filteredJobCardList([
                {
                    $match: {
                        company: ObjectId(req.user.company),
                        _id: ObjectId(req.query.jobCard),
                        status: {$in: [OPTIONS.defaultStatus.REPORT_GENERATED]}
                    }
                },
                {
                    $addFields: {
                        JCDetails: {
                            $map: {
                                input: "$SKUDetails",
                                as: "details",
                                in: {
                                    SKU: "$$details.SKU",
                                    SKUNo: "$$details.SKUNo",
                                    SKUName: "$$details.SKUName",
                                    SKUDescription: "$$details.SKUDescription",
                                    UOM: "$$details.UOM",
                                    batchInfo: "$$details.batchInfo",
                                    SO_FCLineTargetDate: "$$details.SO_FCLineTargetDate",
                                    referenceModel: "SKUMaster"
                                }
                            }
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
                        _id: {jobCard: "$_id", SKU: "$JCDetails.SKU"},
                        jobCardNo: {$first: "$jobCardNo"},
                        SKUNo: {$first: "$JCDetails.SKUNo"},
                        SKUName: {$first: "$JCDetails.SKUName"},
                        SKUDescription: {$first: "$JCDetails.SKUDescription"},
                        UOM: {$first: "$JCDetails.UOM"},
                        batchQty: {$first: "$batchInfo.totalBatchQuantity"},
                        orderType: {$first: "$orderType"},
                        referenceModel: {$first: "$JCDetails.referenceModel"},
                        batchDate: {$first: "$JCDetails.SO_FCLineTargetDate"},
                        customerName: {$first: "$customerName"},
                        customer: {$first: "$reference"}
                    }
                },
                {
                    $lookup: {
                        from: "SKUMaster",
                        localField: "_id.SKU",
                        foreignField: "_id",
                        pipeline: [{$project: {SKUStage: 1, artWorkHyperLink: 1}}],
                        as: "SKU"
                    }
                },
                {$unwind: "$SKU"},
                {
                    $project: {
                        _id: "$_id.jobCard",
                        jobCardNo: 1,
                        SKU: "$_id.SKU",
                        SKUNo: 1,
                        SKUStage: "$SKU.SKUStage",
                        SKUName: 1,
                        SKUDescription: 1,
                        artWorkHyperLink: "$SKU.artWorkHyperLink",
                        UOM: 1,
                        batchQty: 1,
                        batchDate: 1,
                        orderType: 1,
                        referenceModel: 1,
                        customerName: 1,
                        customer: 1,
                        stockPrep: 1,
                        generateReport: {
                            batchInputQty: {$literal: 0},
                            batchOutputQty: {$literal: 0},
                            batchRejQty: {$literal: 0},
                            jobCardClosureDate: {$literal: null},
                            checkoutStatus: {$literal: null}
                        }
                    }
                },
                {
                    $sort: {jobCardNo: 1}
                }
            ]);
        }
        const stockPrepData = await filteredStockPreparationList([
            {
                $match: {
                    jobCard: ObjectId(req.query.jobCard)
                }
            },
            {
                $unwind: "$stockPreparationDetails"
            },
            {
                $match: {
                    "stockPreparationDetails.itemCode": {
                        $regex: "^M10"
                    }
                }
            },
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "SKU",
                    foreignField: "_id",
                    pipeline: [{$project: {ups: "$dimensionsDetails.layoutDimensions.ups"}}],
                    as: "SKU"
                }
            },
            {$unwind: "$SKU"},
            {$project: {batchInputQty: {$round: [{$multiply: ["$stockPreparationDetails.GTQty", "$SKU.ups"]}, 2]}}}
        ]);
        let batchInputQty = 0;
        if (stockPrepData.length) {
            batchInputQty = stockPrepData[0].batchInputQty;
        }
        let processListConfig = await filteredProdProcessConfigList([
            {
                $match: {
                    prodUnitConfigId: ObjectId(req.query.prodUnitConfig)
                }
            },
            {
                $sort: {
                    srNo: 1
                }
            },
            {
                $group: {
                    _id: "$prodUnitConfigId",
                    processDetails: {
                        $push: {
                            seq: null,
                            process: "$_id",
                            processName: "$prodProcessName",
                            sourceOfManufacturing: "$source",
                            processOriginalName: "$processOriginalName",
                            qualityOriginalName: "$qualityOriginalName"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    processDetails: 1
                }
            },
            {
                $unwind: "$processDetails"
            },
            {$replaceRoot: {newRoot: "$processDetails"}}
        ]);
        const SKUProcessList = await filteredSKUProcessFlowList([
            {
                $match: {
                    SKU: ObjectId(req.query.SKU)
                }
            },
            {
                $unwind: "$PFDetails"
            },
            {
                $addFields: {
                    processMaster: {
                        $filter: {
                            input: processListConfig,
                            as: "process",
                            cond: {$eq: ["$$process.processName", "$PFDetails.processName"]}
                        }
                    }
                }
            },
            {$unwind: "$processMaster"},
            {
                $project: {
                    seq: "$PFDetails.seq",
                    process: "$PFDetails.process",
                    processName: "$PFDetails.processName",
                    processOriginalName: "$processMaster.processOriginalName",
                    qualityOriginalName: "$processMaster.qualityOriginalName",
                    sourceOfManufacturing: "$processMaster.sourceOfManufacturing",
                    IPQALog: {
                        adherenceToProcessStd: {$literal: false},
                        inProcessInfo: [
                            {
                                date: new Date(),
                                inProcessNonConformance: {$literal: null},
                                inProcessCorrection: {$literal: null}
                            }
                        ],
                        remarks: {$literal: null},
                        IPQAInCharge: {$literal: null}
                    },
                    processStatus: {$literal: false}
                }
            }
        ]);

        return res.success({
            jobCardEntryData: jobCardEntryData.length ? jobCardEntryData[0] : {},
            SKUProcessList,
            batchInputQty
        });
    } catch (error) {
        console.error("getProcessFromDirectCostBySKUId Job Card Entry", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await JobCardEntryRepository.findOneDoc({jobCard: req.params.id});
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Job Card Entry");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Job Card Entry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllForRejection = asyncHandler(async (req, res) => {
    try {
        const {status = null} = req.query;
        let project = getAllJobCardEntryRejectAttributes();
        let pipeline = [
            {
                $addFields: {
                    status: {
                        $cond: [
                            {$gt: ["$rejectedTotalQty", 0]},
                            OPTIONS.defaultStatus.INACTIVE,
                            OPTIONS.defaultStatus.ACTIVE
                        ]
                    }
                }
            },
            {
                $match: {
                    company: ObjectId(req.user.company),
                    ...(!!status && {status: status}),
                    rejectStatus: {$nin: [OPTIONS.defaultStatus.ACCEPTED]},
                    "generateReport.checkoutStatus": {
                        $in: [OPTIONS.defaultStatus.MARK_AS_COMPLETED, OPTIONS.defaultStatus.SKIP_INTEGRATION]
                    }
                }
            }
        ];

        let rows = await JobCardEntryRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        totalEntry: {$sum: 1},
                        rejectedEntry: {$sum: {$cond: [{$gt: ["$batchRejQty", 0]}, 1, 0]}}
                    }
                },
                {
                    $project: {
                        totalEntry: {$round: ["$totalEntry", 2]},
                        rejectedEntry: {$round: ["$rejectedEntry", 2]},
                        _id: 0
                    }
                }
            ]
        });
        return res.success({
            ...rows,
            statusOptions: [
                {label: "Report by Status - Green", value: OPTIONS.defaultStatus.ACTIVE},
                {label: "Report by Status - Red", value: OPTIONS.defaultStatus.INACTIVE}
            ]
        });
    } catch (e) {
        console.error("getAllForRejection", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
