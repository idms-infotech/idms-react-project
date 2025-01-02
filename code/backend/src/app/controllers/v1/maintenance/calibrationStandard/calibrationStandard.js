const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/maintenance/calibrationStandardModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const {
    getAllCalibrationStandardAttributes,
    getAllCalibrationStandardExcelAttributes
} = require("../../../../models/maintenance/helpers/calibrationStandardHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {CALIBRATION_STANDARD} = require("../../../../mocks/schemasConstant/maintenanceConstant");
const {
    getAllCalibrationStandardAggregate
} = require("../../../../models/maintenance/repository/calibrationStandardRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");

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
                message: MESSAGES.apiSuccessStrings.ADDED("Calibration Standard")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Calibration Standard", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllCalibrationStandardAttributes();
        if (req.query.excel == "true") {
            project = getAllCalibrationStandardExcelAttributes();
        }
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: {$in: OPTIONS.defaultStatus.getAllFilterStatusArray(["ACTIVE", "UNDER_REPAIR"])}
                }
            }
        ];
        let rows = await getAllCalibrationStandardAggregate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllCalibrationStandards", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Calibration Standard");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Calibration Standard", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("Calibration Standard")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Calibration Standard");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Calibration Standard", e);
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
            message: MESSAGES.apiSuccessStrings.UPDATE("Calibration Standard has been")
        });
    } catch (e) {
        console.error("update Calibration Standard", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const standardTypeOptions = await getAllModuleMaster(req.user.company, "CALIBRATION_STANDARD_TYPE");
        let  locationOptions = await getAllModuleMaster(req.user.company,"LOCATION");
        const calibrationAgencyOptions = await getAllModuleMaster(req.user.company, "CALIBRATION_AGENCY");
        let standardStatusOptions = await getAllModuleMaster(req.user.company, "STANDARD_STATUS");
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...CALIBRATION_STANDARD.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        return res.success({
            autoIncrementNo,
            locationOptions,
            calibrationAgencyOptions,
            standardStatusOptions,
            standardTypeOptions
        });
    } catch (error) {
        console.error("getAllMasterData Calibration Standard", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
