const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/maintenance/maintenanceScheduleCreationModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const {getAllAssetMasterList} = require("../../finance/assetMaster/assetMaster");
const {ASSET_CLASS_NAMES} = require("../../../../mocks/constantData");
const {
    getAllMaintenanceScheduleAttributes,
    getAllMaintenanceScheduleReportsAttributes
} = require("../../../../models/maintenance/helpers/maintenanceScheduleCreationHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {MAINTENANCE_SCHEDULE} = require("../../../../mocks/schemasConstant/maintenanceConstant");
const {filteredAssetMasterList} = require("../../../../models/finance/repository/assetMasterRepository");
const {filteredMaintenanceTaskList} = require("../../../../models/maintenance/repository/maintenanceTaskRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const MaintenanceScheduleRepository = require("../../../../models/maintenance/repository/maintenanceScheduleCreationRepository");
const ObjectId = mongoose.Types.ObjectId;

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
                message: MESSAGES.apiSuccessStrings.ADDED("Maintenance Schedule Creation")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Maintenance Schedule Creation", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllMaintenanceScheduleAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company)}},
            {
                $addFields: {
                    startDateS: {$dateToString: {format: "%d-%m-%Y", date: "$startDate"}},
                    endDateS: {$dateToString: {format: "%d-%m-%Y", date: "$endDate"}}
                }
            },
            {
                $lookup: {
                    from: "Asset",
                    localField: "equipment",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 0, assetName: 1}}],
                    as: "equipment"
                }
            },
            {$unwind: {path: "$equipment", preserveNullAndEmptyArrays: true}},
            {
                $lookup: {
                    from: "MaintenanceTask",
                    localField: "maintenanceTask",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 0, taskName: 1}}],
                    as: "maintenanceTask"
                }
            },
            {$unwind: {path: "$maintenanceTask", preserveNullAndEmptyArrays: true}}
        ];
        let rows = await MaintenanceScheduleRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        console.error("getAll Maintenance Schedule Creation", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Maintenance Schedule Creation");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Maintenance Schedule Creation", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Maintenance Schedule Creation")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Maintenance Schedule Creation");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Maintenance Schedule Creation", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

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

        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Maintenance Schedule Creation has been")
        });
    } catch (e) {
        console.error("update Maintenance Schedule Creation", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...MAINTENANCE_SCHEDULE.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        const equipmentListOptions = await filteredAssetMasterList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.ACTIVE,
                    assetType: ASSET_CLASS_NAMES.MACHINES
                }
            },
            {$sort: {assetCode: -1}},
            {
                $project: {
                    _id: 1,
                    assetCode: 1,
                    assetName: 1
                }
            }
        ]);
        const maintenanceTaskCodeOptions = await filteredMaintenanceTaskList([
            {$match: {company: ObjectId(req.user.company)}},
            {$sort: {taskCode: -1}},
            {
                $project: {
                    _id: 1,
                    taskName: 1
                }
            }
        ]);
        const frequencyOptions = await getAllModuleMaster(req.user.company, "FREQUENCY");
        return res.success({
            frequencyOptions,
            autoIncrementNo,
            equipmentListOptions,
            maintenanceTaskCodeOptions
        });
    } catch (error) {
        console.error("getAllMasterData Maintenance Schedule Creation", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const taskCategory = await getAllModuleMaster(req.user.company, "TASK_TYPE");
        const equipments = await getAllAssetMasterList(req.user.company, ASSET_CLASS_NAMES.MACHINES, {
            assetCode: 1,
            assetName: 1
        });
        const {equipmentId = null, maintenanceTask = null, fromDate = null, toDate = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!equipmentId && {
                equipment: ObjectId(equipmentId)
            }),
            ...(!!toDate &&
                !!fromDate && {
                    startDate: {$gte: getStartDateTime(fromDate)},
                    endDate: {
                        $lte: getEndDateTime(toDate)
                    }
                })
        };
        let project = getAllMaintenanceScheduleReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $lookup: {
                    from: "Asset",
                    localField: "equipment",
                    foreignField: "_id",
                    pipeline: [{$project: {assetCode: 1, assetName: 1, assetType: 1}}],
                    as: "equipment"
                }
            },
            {$unwind: "$equipment"},

            {
                $lookup: {
                    from: "MaintenanceTask",
                    localField: "maintenanceTask",
                    foreignField: "_id",
                    pipeline: [{$project: {taskCategory: 1, createdAt: 1}}],
                    as: "maintenanceTask"
                }
            },
            {$unwind: "$maintenanceTask"},
            {
                $match: {
                    ...(!!maintenanceTask && {
                        "maintenanceTask.taskCategory": maintenanceTask
                    })
                }
            }
        ];
        let rows = await MaintenanceScheduleRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            taskCategory,
            equipments,
            ...rows
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
