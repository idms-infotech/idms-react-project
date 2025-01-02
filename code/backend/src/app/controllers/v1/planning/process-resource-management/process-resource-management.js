const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/planning/processResourceManagementModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {outputData, getAllAggregationFooter} = require("../../../../helpers/utility");
const {generateCreateData, getMatchData, OPTIONS} = require("../../../../helpers/global.options");
const {getAllMapProcessMachine} = require("../../production/map-process-machine/map-process-machine");
const {
    getAllProcessResourceManagementAttributes
} = require("../../../../models/planning/helpers/processResourceManagementHelper");
const {default: mongoose} = require("mongoose");
const {PROCESS_RESOURCE_MANAGEMENT} = require("../../../../mocks/schemasConstant/planningConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {
    getAllProcessResourceManagementAggregate
} = require("../../../../models/planning/repository/processResourceManagementRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.create = asyncHandler(async (req, res) => {
    try {
        let existingUser = await Model.findOne({
            process: req.body.process,
            machine: req.body.machine
        });
        if (existingUser) {
            let errors = "Process already exists with this same Machine";
            return res.preconditionFailed(errors);
        }
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
                message: MESSAGES.apiSuccessStrings.ADDED("ProcessResourceManagement")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create ProcessResourceManagement", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllProcessResourceManagementAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company)
                }
            }
        ];

        let rows = await getAllProcessResourceManagementAggregate({
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

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("ProcessResourceManagement");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById ProcessResourceManagement", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("ProcessResourceManagement")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("ProcessResourceManagement");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById ProcessResourceManagement", e);
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
            message: MESSAGES.apiSuccessStrings.UPDATE("ProcessResourceManagement has been")
        });
    } catch (e) {
        console.error("update ProcessResourceManagement", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...PROCESS_RESOURCE_MANAGEMENT.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        const mapProcessMachineList = await getAllMapProcessMachine(req.user.company);
        return res.success({
            autoIncrementNo,
            mapProcessMachineList
        });
    } catch (error) {
        console.error("getAllMasterData ProcessResourceManagement", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllProcessResourceManagement = async company => {
    try {
        let rows = await Model.find({
            status: OPTIONS.defaultStatus.ACTIVE,
            company: company
        }).sort({createdAt: 1});
        return rows;
    } catch (e) {
        console.error("getAllProcessResourceManagement", e);
    }
};

exports.getAllProcessResourceManagementByEquipment = async (company, equipment, process) => {
    try {
        let rows = await Model.findOne({
            status: OPTIONS.defaultStatus.ACTIVE,
            company: company,
            machine: equipment,
            process: process
        }).sort({createdAt: 1});
        return rows;
    } catch (e) {
        console.error("getAllProcessResourceManagementByEquipment", e);
    }
};
