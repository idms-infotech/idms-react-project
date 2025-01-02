const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllJCEntryAttributes} = require("../../../../models/production/helpers/jcEntryHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {JC_ENTRY} = require("../../../../mocks/schemasConstant/productionConstant");
const JCEntryRepository = require("../../../../models/production/repository/jcEntryRepository");
const {filteredProcessNameMasterList} = require("../../../../models/settings/repository/processNameRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const {filteredJobCardList} = require("../../../../models/planning/repository/jobCardRepository");
const SKUMasterRepository = require("../../../../models/sales/repository/SKUMasterRepository");
const {getExpiryDate} = require("../../../../helpers/dateTime");
const FGINRepository = require("../../../../models/stores/repository/FGINRepository");
const {getCompanyLocations} = require("../../settings/company/company");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllJCEntryAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company), status: {$ne: OPTIONS.defaultStatus.REPORT_GENERATED}}}
        ];
        let rows = await JCEntryRepository.getAllPaginate({
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
        const itemDetails = await JCEntryRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("JC Entry")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create JC Entry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await JCEntryRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        if (req.body.status && req.body.status == OPTIONS.defaultStatus.MARK_AS_COMPLETED) {
            req.body.approvedDate = new Date();
        }
        itemDetails = await JCEntryRepository.updateDoc(itemDetails, req.body);
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
                FGINDate: itemDetails?.approvedDate ?? new Date(),
                manufacturingDate: itemDetails?.approvedDate ?? new Date(),
                expiryDate: getExpiryDate(SKUDetails?.shelfLife, new Date()),
                FGINQuantity: itemDetails.batchOutputQty,
                previousDRNQty: 0,
                batchNo: itemDetails.batchNumber,
                location: itemDetails.location
            };
            await FGINRepository.createDoc(fginData);
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("JC Entry has been")
        });
    } catch (e) {
        console.error("update JC Entry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await JCEntryRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("JC Entry")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("JC Entry");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById JC Entry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await JCEntryRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("JC Entry");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById JC Entry", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(JC_ENTRY.AUTO_INCREMENT_DATA(), req.user.company, false);
        const processNameList = await filteredProcessNameMasterList([
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE,
                    company: ObjectId(req.user.company)
                }
            },
            {
                $sort: {order: 1}
            },
            {
                $project: {
                    seq: null,
                    processName: 1,
                    process: "$_id",
                    production: {
                        prodInfo: {
                            $ifNull: [
                                {
                                    $map: {
                                        input: "$defineSubProcesses",
                                        as: "details",
                                        in: {
                                            seq: "$$details.order",
                                            subProcessName: "$$details.subProcessName",
                                            prodStartDate: new Date(),
                                            prodEndDate: new Date(),
                                            operatingStaff: null,
                                            prodStatus: {$literal: false}
                                        }
                                    }
                                },
                                []
                            ]
                        },
                        prodRemarks: null
                    },
                    IPQA: {
                        IPQAInfo: {
                            $ifNull: [
                                {
                                    $map: {
                                        input: "$defineSubProcesses",
                                        as: "details",
                                        in: {
                                            seq: "$$details.order",
                                            subProcessName: "$$details.subProcessName",
                                            inspectedBy: null,
                                            offerDate: new Date(),
                                            releasedDate: new Date(),
                                            releaseStatus: null,
                                            IPQAStatus: {$literal: false}
                                        }
                                    }
                                },
                                []
                            ]
                        },
                        IPQARemarks: null
                    },
                    status: {$literal: false}
                }
            }
        ]);
        const JCOptions = await filteredJobCardList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: {$in: [OPTIONS.defaultStatus.REPORT_GENERATED]}
                }
            },
            {
                $lookup: {
                    from: "JCEntry",
                    localField: "_id",
                    foreignField: "jobCard",
                    pipeline: [{$project: {_id: 1}}],
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
                $sort: {jobCardNo: 1}
            }
        ]);
        const releaseStatusOptions = [
            OPTIONS.defaultStatus.NA,
            OPTIONS.defaultStatus.RELEASED,
            OPTIONS.defaultStatus.ON_HOLD,
            OPTIONS.defaultStatus.REJECTED
        ];
        const billFromLocationOptions = await getCompanyLocations(req.user.company);
        return res.success({
            autoIncrementNo,
            processNameList,
            JCOptions,
            releaseStatusOptions,
            billFromLocationOptions: billFromLocationOptions?.split(",")?.map(x => {
                return {
                    label: x,
                    value: x
                };
            })
        });
    } catch (error) {
        console.error("getAllMasterData JC Entry", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
