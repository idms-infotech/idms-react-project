const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/maintenance/maintenanceTaskModel");
const MESSAGES = require("../../../../helpers/messages.options");
const { findAppParameterValue } = require("../../settings/appParameter/appParameter");
const { generateCreateData, OPTIONS } = require("../../../../helpers/global.options");
const { default: mongoose } = require("mongoose");
const { getAllAssetMasterList } = require("../../finance/assetMaster/assetMaster");
const { ASSET_CLASS_NAMES } = require("../../../../mocks/constantData");
const {
    getAllMaintenanceTaskAttributes,
    getAllMaintenanceTaskExcelAttributes
} = require("../../../../models/maintenance/helpers/maintenanceTaskHelper");
const { getAndSetAutoIncrementNo } = require("../../settings/autoIncrement/autoIncrement");
const { MAINTENANCE_TASK } = require("../../../../mocks/schemasConstant/maintenanceConstant");
const {
    filteredMaintenanceChecklistList
} = require("../../../../models/maintenance/repository/maintenanceChecklistRepository");
const { getAllMaintenanceTaskAggregate } = require("../../../../models/maintenance/repository/maintenanceTaskRepository");
const { PRIORITY } = require("../../../../mocks/issueAppParameter");
const { getAllModuleMaster } = require("../../settings/module-master/module-master");
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
                message: MESSAGES.apiSuccessStrings.ADDED("Maintenance Task")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Maintenance Task", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllMaintenanceTaskAttributes();
        if (req.query.excel == "true") {
            project = getAllMaintenanceTaskExcelAttributes();
        }
        let pipeline = [
            { $match: { company: ObjectId(req.user.company) } },
            {
                $lookup: {
                    from: "Asset",
                    localField: "equipment",
                    foreignField: "_id",
                    pipeline: [{ $project: { _id: 0, assetName: 1 } }],
                    as: "equipment"
                }
            },
            { $unwind: "$equipment" },
            {
                $lookup: {
                    from: "MaintenanceChecklist",
                    localField: "maintenanceChecklist",
                    foreignField: "_id",
                    pipeline: [{ $project: { _id: 0, checklistName: 1 } }],
                    as: "maintenanceChecklist"
                }
            },
            { $unwind: "$maintenanceChecklist" }
        ];
        let rows = await getAllMaintenanceTaskAggregate({ pipeline, project, queryParams: req.query });
        return res.success(rows);
    } catch (e) {
        console.error("getAllMaintenanceTask", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Maintenance Task");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Maintenance Task", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("Maintenance Task")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Maintenance Task");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Maintenance Task", e);
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
            message: MESSAGES.apiSuccessStrings.UPDATE("Maintenance Task has been")
        });
    } catch (e) {
        console.error("update Maintenance Task", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMaintenanceTask = asyncHandler(async company => {
    try {
        let rows = await Model.find({
            company: company
        })
            .populate("equipment", "assetName")
            .sort({ taskCode: -1 });

        return rows;
    } catch (e) {
        console.error("getAllMaintenanceTask", e);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const frequencyOptions = await getAllModuleMaster(req.user.company, "FREQUENCY");
        const taskCategoryOptions = await getAllModuleMaster(req.user.company, "TASK_TYPE");
        const taskStatusOptions = await getAllModuleMaster(req.user.company, "TASK_STATUS");
        const equipmentOptions = await getAllAssetMasterList(req.user.company, ASSET_CLASS_NAMES.MACHINES, {
            assetName: 1
        });

        const maintenanceChecklistOptions = await filteredMaintenanceChecklistList([
            { $match: { company: ObjectId(req.user.company), status: OPTIONS.defaultStatus.ACTIVE } },
            { $sort: { checklistCode: -1 } },
            {
                $project: {
                    checklistName: 1
                }
            }
        ]);
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            { ...MAINTENANCE_TASK.AUTO_INCREMENT_DATA() },
            req.user.company
        );
        return res.success({
            autoIncrementNo,
            equipmentOptions,
            maintenanceChecklistOptions,
            priorityOptions: PRIORITY,
            frequencyOptions,
            taskCategoryOptions,
            taskStatusOptions 
        });
    } catch (error) {
        console.error("getAllMasterData Maintenance Task", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMaintenanceChecklist = asyncHandler(async equipmentId => {
    try {
        let rows = await Model.aggregate([
            {
                $match: { equipment: ObjectId(equipmentId) }
            },
            {
                $lookup: {
                    from: "MaintenanceChecklist",
                    localField: "maintenanceChecklist",
                    foreignField: "_id",
                    pipeline: [{ $project: { _id: 0, checklistInstruction: 1 } }],
                    as: "maintenanceChecklist"
                }
            },
            {
                $unwind: "$maintenanceChecklist"
            },
            {
                $unwind: "$maintenanceChecklist.checklistInstruction"
            },
            {
                $project: {
                    _id: 0,
                    srNo: "$maintenanceChecklist.checklistInstruction.srNo",
                    description: "$maintenanceChecklist.checklistInstruction.description"
                }
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllMaintenanceChecklist", e);
    }
});
