const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/maintenance/maintenanceMetricsModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {generateCreateData, getMatchData} = require("../../../../helpers/global.options");
const {
    getAllMaintenanceMetricsAttributes,
    getAllMaintenanceMetricsExcelAttributes
} = require("../../../../models/maintenance/helpers/maintenanceMetricsHelper");
const {default: mongoose} = require("mongoose");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {MAINTENANCE_METRICS} = require("../../../../mocks/schemasConstant/maintenanceConstant");
const {
    getAllMaintenanceMetricsAggregate
} = require("../../../../models/maintenance/repository/maintenanceMetricsRepository");
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
                message: MESSAGES.apiSuccessStrings.ADDED("Maintenance Metrics")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Maintenance Metrics", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllMaintenanceMetricsAttributes();
        if (req.query.excel == "true") {
            project = getAllMaintenanceMetricsExcelAttributes();
        }
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await getAllMaintenanceMetricsAggregate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAll Maintenance Metrics", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Maintenance Metrics");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Maintenance Metrics", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("Maintenance Metrics")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Maintenance Metrics");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Maintenance Metrics", e);
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
            message: MESSAGES.apiSuccessStrings.UPDATE("Maintenance Metrics has been")
        });
    } catch (e) {
        console.error("update Maintenance Metrics", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const frequencyOptions = await getAllModuleMaster(req.user.company, "FREQUENCY");
        const metricTypeOptions = await getAllModuleMaster(req.user.company, "METRIC_TYPE");
        const calculationMethodOptions = await getAllModuleMaster(req.user.company, "CALCULATION_METHOD");
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...MAINTENANCE_METRICS.AUTO_INCREMENT_DATA()},
            req.user.company
        );

        return res.success({
            frequencyOptions,
            metricTypeOptions,
            calculationMethodOptions,
            autoIncrementNo
        });
    } catch (error) {
        console.error("getAllMasterData Maintenance Metrics", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
