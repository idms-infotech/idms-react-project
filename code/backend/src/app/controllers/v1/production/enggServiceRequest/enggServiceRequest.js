const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllEnggServiceRequestAttributes,
    getAllMainBDAttributes,
    getAllEnggServiceReportsAttributes
} = require("../../../../models/production/helpers/enggServiceRequestHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {ENGG_SERVICE_REQUEST} = require("../../../../mocks/schemasConstant/productionConstant");
const EnggServiceRequestRepository = require("../../../../models/production/repository/enggServiceRequestRepository");
const {filteredAssetMasterList} = require("../../../../models/finance/repository/assetMasterRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const {PRIORITY} = require("../../../../mocks/issueAppParameter");
const {getAllCheckedAssetCategoriesList} = require("../../settings/assetClass/assetClass");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllEnggServiceRequestAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: {$ne: OPTIONS.defaultStatus.APPROVED}
                }
            }
        ];
        let rows = await EnggServiceRequestRepository.getAllPaginate({
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
        const itemDetails = await EnggServiceRequestRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Engg Service Req")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Engg Service Req", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await EnggServiceRequestRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        if (
            [OPTIONS.defaultStatus.IN_PROGRESS, OPTIONS.defaultStatus.WAITING_FOR_PARTS].includes(
                req.body?.maintenanceStatus
            )
        ) {
            req.body.status = OPTIONS.defaultStatus.IN_PROGRESS;
        } else if (
            [OPTIONS.defaultStatus.ISSUE_RESOLVED, OPTIONS.defaultStatus.ISSUE_FIXED].includes(
                req.body?.maintenanceStatus
            ) &&
            req.body.status != OPTIONS.defaultStatus.APPROVED
        ) {
            req.body.status = OPTIONS.defaultStatus.ISSUE_RESOLVED;
        }
        itemDetails = await EnggServiceRequestRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Engg Service Req")
        });
    } catch (e) {
        console.error("update Engg Service Req", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await EnggServiceRequestRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Engg Service Req")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Engg Service Req");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Engg Service Req", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await EnggServiceRequestRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Engg Service Req");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Engg Service Req", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            ENGG_SERVICE_REQUEST.AUTO_INCREMENT_DATA(),
            req.user.company,
            false
        );
        let assetCategoryArr = await getAllCheckedAssetCategoriesList({
            status: OPTIONS.defaultStatus.ACTIVE,
            maintenance: true
        });
        assetCategoryArr = assetCategoryArr?.map(x => x?.assetClassName);
        const assetOptions = await filteredAssetMasterList([
            {
                $match: {
                    assetType: {$in: assetCategoryArr},
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.ACTIVE
                    // assetType: ASSET_CLASS_NAMES.MACHINES
                }
            },
            {$sort: {assetCode: -1}},
            {
                $project: {
                    _id: 1,
                    asset: "$_id",
                    assetCode: 1,
                    assetName: 1,
                    assetDescription: 1,
                    location: 1
                }
            }
        ]);
        return res.success({
            autoIncrementNo,
            assetOptions,
            priorityOptions: PRIORITY,
            maintenanceStatusOptions: [
                OPTIONS.defaultStatus.IN_PROGRESS,
                OPTIONS.defaultStatus.WAITING_FOR_PARTS,
                OPTIONS.defaultStatus.ISSUE_FIXED,
                OPTIONS.defaultStatus.ISSUE_RESOLVED
            ]
        });
    } catch (error) {
        console.error("getAllMasterData Engg Service Req", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.maintenanceBreakDownMasterData = asyncHandler(async (req, res) => {
    try {
        const issueCategoryOptions = await getAllModuleMaster(req.user.company, "ISSUE_CATEGORY");
        return res.success({
            issueCategoryOptions,
            maintenanceStatusOptions: [
                OPTIONS.defaultStatus.IN_PROGRESS,
                OPTIONS.defaultStatus.WAITING_FOR_PARTS,
                OPTIONS.defaultStatus.ISSUE_FIXED,
                OPTIONS.defaultStatus.ISSUE_RESOLVED
            ]
        });
    } catch (error) {
        console.error("maintenanceBreakDownMasterData Engg Service Req", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllForMainBD = asyncHandler(async (req, res) => {
    try {
        let project = getAllMainBDAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: {$ne: OPTIONS.defaultStatus.APPROVED}
                }
            }
        ];
        let rows = await EnggServiceRequestRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        activeCount: {$sum: 1},
                        awaitingCount: {
                            $sum: {$cond: [{$eq: ["$status", OPTIONS.defaultStatus.CREATED]}, 1, 0]}
                        },
                        inProgressCount: {
                            $sum: {$cond: [{$in: ["$status", [OPTIONS.defaultStatus.IN_PROGRESS]]}, 1, 0]}
                        },
                        issueResolvedCount: {
                            $sum: {$cond: [{$in: ["$status", [OPTIONS.defaultStatus.ISSUE_RESOLVED]]}, 1, 0]}
                        }
                    }
                },
                {
                    $project: {
                        _id: 0
                    }
                }
            ]
        });
        return res.success({
            ...rows,
            statusArray: [
                {label: "Total ESR Count", count: rows?.totalAmounts?.activeCount ?? 0},
                {label: "B/D not attended Count", count: rows?.totalAmounts?.awaitingCount ?? 0},
                {label: "Maintenance In Progress Count", count: rows?.totalAmounts?.inProgressCount ?? 0},
                {label: "Issue Resolved Count", count: rows?.totalAmounts?.issueResolvedCount ?? 0}
            ]
        });
    } catch (e) {
        console.error("getAllForMainBD", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const {toDate = null, fromDate = null} = req.query;
        let project = getAllEnggServiceReportsAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.APPROVED,
                    ...(!!toDate &&
                        !!fromDate && {
                            assetRestorationDate: {
                                $lte: getEndDateTime(toDate),
                                $gte: getStartDateTime(fromDate)
                            }
                        })
                }
            }
        ];
        let rows = await EnggServiceRequestRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({...rows});
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
