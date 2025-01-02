const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/maintenance/maintenanceChecklistModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {generateCreateData, getMatchData, OPTIONS} = require("../../../../helpers/global.options");
const {
    getAllMaintenanceChecklistAttributes
} = require("../../../../models/maintenance/helpers/maintenanceChecklistHelper");
const {default: mongoose} = require("mongoose");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {MAINTENANCE_CHECKLIST} = require("../../../../mocks/schemasConstant/maintenanceConstant");
const {
    getAllMaintenanceChecklistAggregate
} = require("../../../../models/maintenance/repository/maintenanceChecklistRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
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
                message: MESSAGES.apiSuccessStrings.ADDED("Maintenance Checklist")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Maintenance Checklist", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllMaintenanceChecklistAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company)}},
            {
                $lookup: {
                    from: "Asset",
                    localField: "equipment",
                    foreignField: "_id",
                    pipeline: [{$project: {_id: 0, equipment: 1}}],
                    as: "equipment"
                }
            }
        ];
        let rows = await getAllMaintenanceChecklistAggregate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAll Maintenance Checklist", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Maintenance Checklist");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Maintenance Checklist", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("Maintenance Checklist")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Maintenance Checklist");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Maintenance Checklist", e);
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
        if (req.body.checklistInstruction) {
            itemDetails.checklistInstruction = req.body.checklistInstruction;
        }
        itemDetails = await itemDetails.save();

        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Maintenance Checklist has been")
        });
    } catch (e) {
        console.error("update Maintenance Checklist", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllChecklist = asyncHandler(async company => {
    try {
        let rows = await Model.find({
            status: OPTIONS.defaultStatus.ACTIVE,
            company: company
        }).sort({checklistCode: -1});
        return rows;
    } catch (e) {
        console.error("getAllChecklist", e);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...MAINTENANCE_CHECKLIST.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        const checklistCategoryOptions = await getAllModuleMaster(req.user.company, "CHECKLIST_CATEGORY");
        return res.success({
            checklistCategoryOptions,
            autoIncrementNo
        });
    } catch (error) {
        console.error("getAllMasterData Maintenance Checklist", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
