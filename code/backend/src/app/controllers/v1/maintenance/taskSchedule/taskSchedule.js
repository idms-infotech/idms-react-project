const Model = require("../../../../models/maintenance/taskSchedulingModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {generateCreateData, getMatchData, OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {getAllTaskSchedulingAttributes} = require("../../../../models/maintenance/helpers/taskSchedulingHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {TASK_SCHEDULING} = require("../../../../mocks/schemasConstant/maintenanceConstant");
const {filteredMaintenanceTaskList} = require("../../../../models/maintenance/repository/maintenanceTaskRepository");
const {getAllTaskSchedulingAggregate} = require("../../../../models/maintenance/repository/taskSchedulingRepository");
const { getAllModuleMaster } = require("../../settings/module-master/module-master");
const ObjectId = mongoose.Types.ObjectId;

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
};

exports.getAll = async (req, res) => {
    try {
        let project = getAllTaskSchedulingAttributes();
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
                    from: "MaintenanceTask",
                    localField: "maintenanceTask",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 0, taskCode: 1}}],
                    as: "maintenanceTask"
                }
            },
            {$unwind: "$maintenanceTask"}
        ];
        let rows = await getAllTaskSchedulingAggregate({
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
};

exports.getById = async (req, res) => {
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
};

exports.deleteById = async (req, res) => {
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
};

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

        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Maintenance Schedule Creation has been")
        });
    } catch (e) {
        console.error("update Maintenance Schedule Creation", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getAllSchedule = async company => {
    try {
        let rows = await Model.find({
            status: OPTIONS.defaultStatus.SCHEDULED,
            company: company
        }).sort({createdAt: -1});
        return rows;
    } catch (e) {
        console.error("getAllSchedule", e);
    }
};

exports.getAllMasterData = async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...TASK_SCHEDULING.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        const maintenanceTaskCodeOptions = await filteredMaintenanceTaskList([
            {$match: {company: ObjectId(req.user.company)}},
            {$sort: {taskCode: -1}},
            {
                $lookup: {
                    from: "Asset",
                    localField: "equipment",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 0, assetName: 1}}],
                    as: "equipment"
                }
            },
            {$unwind: "$equipment"},
            {
                $project: {
                    _id: 1,
                    label: {$concat: ["$taskCode", " - ", "$taskName"]},
                    value: "$_id",
                    taskCode: 1,
                    taskName: 1,
                    equipment: 1,
                    priority: 1,
                    frequency: 1,
                    assetName: "$equipment.assetName"
                }
            }
        ]);
        const TaskSchedulingStatusOptions = await getAllModuleMaster(req.user.company, "TASK_SCHEDULING_STATUS");
        return res.success({
            TaskSchedulingStatusOptions,
            autoIncrementNo,
            maintenanceTaskCodeOptions
        });
    } catch (error) {
        console.error("getAllMasterData Maintenance Schedule Creation", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getAllCompletedTaskSchedule = async company => {
    let result = await Model.aggregate([
        {
            $match: {
                company: ObjectId(company)
            }
        },
        {
            $group: {
                _id: null,
                completedCount: {$sum: {$cond: [{$eq: ["$status", "Completed"]}, 1, 0]}},
                totalCount: {$sum: 1}
            }
        },
        {
            $project: {
                _id: 0,
                percentage: {$round: [{$multiply: [{$divide: ["$completedCount", "$totalCount"]}, 100]}, 2]},
                efficiency: {$round: [{$divide: ["$completedCount", "$totalCount"]}, 2]}
            }
        }
    ]);
    result = {
        percentage: result[0]?.percentage || 0,
        efficiency: result[0]?.efficiency || 0
    };
    return result;
};
