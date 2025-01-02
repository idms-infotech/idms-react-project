const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllSampleJCEntryAttributes} = require("../../../../models/businessLeads/helpers/sampleJCEntryHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {SAMPLE_JC_ENTRY} = require("../../../../mocks/schemasConstant/businessLeadsConstant");
const SampleJCEntryRepository = require("../../../../models/businessLeads/repository/sampleJCEntryRepository");
const {filteredProcessMasterList} = require("../../../../models/planning/repository/processMasterRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const {
    filteredSampleJCCreationList
} = require("../../../../models/businessLeads/repository/sampleJCCreationRepository");
const {filteredDirectCostList} = require("../../../../models/planning/repository/directCostRepository");
const {getCompanyLocations} = require("../../settings/company/company");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const SKUMasterRepository = require("../../../../models/sales/repository/SKUMasterRepository");
const FGINRepository = require("../../../../models/stores/repository/FGINRepository");
const {getExpiryDate} = require("../../../../helpers/dateTime");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllSampleJCEntryAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company), status: {$ne: OPTIONS.defaultStatus.REPORT_GENERATED}}}
        ];
        let rows = await SampleJCEntryRepository.getAllPaginate({
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
        const itemDetails = await SampleJCEntryRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Sample JC Entry")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Sample JC Entry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await SampleJCEntryRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        if (req.body.status && req.body.status == OPTIONS.defaultStatus.MARK_AS_COMPLETED) {
            req.body.approvedDate = new Date();
        }
        itemDetails = await SampleJCEntryRepository.updateDoc(itemDetails, req.body);
        if (itemDetails.status == OPTIONS.defaultStatus.REPORT_GENERATED) {
            let SKUDetails = await SKUMasterRepository.getDocById(itemDetails.SKU, {shelfLife: 1, customerInfo: 1});
            let fginData = {
                company: itemDetails.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                FGINNo: "FGIN000",
                SKUId: itemDetails.SKU,
                SKUNo: itemDetails.SKUNo,
                SKUName: itemDetails.SKUName,
                SKUDescription: itemDetails.SKUDescription,
                UOM: itemDetails.UOM,
                partNo: SKUDetails?.customerInfo[0].customerPartNo,
                FGINDate: itemDetails.approvedDate,
                manufacturingDate: itemDetails.approvedDate,
                expiryDate: getExpiryDate(SKUDetails?.shelfLife, new Date()),
                FGINQuantity: itemDetails.batchOutputQty,
                previousDRNQty: 0,
                batchNo: itemDetails.batchNumber,
                location: itemDetails.location
            };
            await FGINRepository.createDoc(fginData);
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Sample JC Entry has been")
        });
    } catch (e) {
        console.error("update Sample JC Entry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await SampleJCEntryRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Sample JC Entry")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Sample JC Entry");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Sample JC Entry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await SampleJCEntryRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Sample JC Entry");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Sample JC Entry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            SAMPLE_JC_ENTRY.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
        const processMasterOptions = await filteredProcessMasterList([
            {
                $project: {
                    _id: 0,
                    seq: null,
                    process: "$_id",
                    processName: 1,
                    UOM: "$unitProcessOutput",
                    machineName: {
                        $getField: {
                            field: "assetName",
                            input: {$first: "$assetAllocationDetails"}
                        }
                    },
                    machine: {
                        $getField: {
                            field: "asset",
                            input: {$first: "$assetAllocationDetails"}
                        }
                    },
                    machineInfo: {
                        $map: {
                            input: "$assetAllocationDetails",
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
        ]);
        const JCOptions = await filteredSampleJCCreationList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: {$in: [OPTIONS.defaultStatus.REPORT_GENERATED]}
                }
            },
            {
                $lookup: {
                    from: "SampleJCEntry",
                    localField: "_id",
                    foreignField: "jobCard",
                    pipeline: [{$project: {_id: 1}}],
                    as: "sampleJCEntry"
                }
            },
            {
                $match: {
                    sampleJCEntry: {$size: 0}
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
                    _id: {jobCard: "$_id", SKU: "$SKUDetails.SKU"},
                    jobCardNo: {$first: "$jobCardNo"},
                    SKUNo: {$first: "$SKUDetails.SKUNo"},
                    SKUName: {$first: "$SKUDetails.SKUName"},
                    SKUDescription: {$first: "$SKUDetails.SKUDescription"},
                    UOM: {$first: "$SKUDetails.UOM"},
                    batchQty: {$first: "$batchInfo.totalBatchQuantity"},
                    orderType: {$first: "$orderType"}
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
                    orderType: 1
                }
            },
            {
                $sort: {jobCardNo: 1}
            }
        ]);
        const releaseStatusOptions = [
            OPTIONS.defaultStatus.RELEASED,
            OPTIONS.defaultStatus.ON_HOLD,
            OPTIONS.defaultStatus.REJECTED
        ];
        const billFromLocationOptions = await getCompanyLocations(req.user.company);
        const shiftOptions = await getAllModuleMaster(req.user.company, "PRODUCTION_SHIFT");
        return res.success({
            autoIncrementNo,
            processMasterOptions,
            JCOptions,
            releaseStatusOptions,
            shiftOptions,
            billFromLocationOptions: billFromLocationOptions?.split(",")?.map(x => {
                return {
                    label: x,
                    value: x
                };
            })
        });
    } catch (error) {
        console.error("getAllMasterData Sample JC Entry", error);
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
        let processList = await filteredDirectCostList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    SKU: ObjectId(req.query.SKUId)
                }
            },
            ...pipeline
        ]);
        return res.success(processList);
    } catch (error) {
        console.error("getProcessFromDirectCostBySKUId Sample JCEntry", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
