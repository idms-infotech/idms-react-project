const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/maintenance/maintenanceTechnicianModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {generateCreateData, getMatchData, OPTIONS} = require("../../../../helpers/global.options");
const {
    getAllMaintenanceTechnicianAttributes,
    getAllMaintenanceTechnicianExcelAttributes
} = require("../../../../models/maintenance/helpers/maintenanceTechnicianHelper");
const {default: mongoose} = require("mongoose");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {MAINTENANCE_TECHNICIAN} = require("../../../../mocks/schemasConstant/maintenanceConstant");
const {
    getAllMaintenanceTechnicianAggregate
} = require("../../../../models/maintenance/repository/maintenanceTechnicianRepository");
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
                message: MESSAGES.apiSuccessStrings.ADDED("Maintenance Technician")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Maintenance Technician", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllMaintenanceTechnicianAttributes();
        if (req.query.excel == "true") {
            project = getAllMaintenanceTechnicianExcelAttributes();
        }
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await getAllMaintenanceTechnicianAggregate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        console.error("getAll Maintenance Technician", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Maintenance Technician");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Maintenance Technician", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("Maintenance Technician")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Maintenance Technician");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Maintenance Technician", e);
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
            message: MESSAGES.apiSuccessStrings.UPDATE("Maintenance Technician has been")
        });
    } catch (e) {
        console.error("update Maintenance Technician", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllTechnicians = asyncHandler(async company => {
    try {
        let rows = await Model.find({
            technicianStatus: OPTIONS.defaultStatus.ACTIVE,
            company: company
        }).sort({technicianCode: -1});
        return rows;
    } catch (e) {
        console.error("getAllTechnicians", e);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const technicianRoleOptions = await getAllModuleMaster(req.user.company, "TECHNICIAN_ROLE");
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...MAINTENANCE_TECHNICIAN.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        return res.success({
            autoIncrementNo,
            technicianRoleOptions
        });
    } catch (error) {
        console.error("getAllMasterData Maintenance Technician", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
