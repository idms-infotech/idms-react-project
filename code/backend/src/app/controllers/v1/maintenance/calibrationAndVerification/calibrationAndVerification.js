const Model = require("../../../../models/maintenance/calibrationAndVerificationModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {getFirstDateOfMonth, getLastDateOfMonth} = require("../../../../utilities/utility");
const {getEndDateTime, getStartDateTime, dateToAnyFormat} = require("../../../../helpers/dateTime");
const {ASSET_CLASS_NAMES} = require("../../../../mocks/constantData");
const {
    getAllCalibrationAndVerificationAttributes,
    getAllCalibrationAndVerificationReportsAttributes
} = require("../../../../models/maintenance/helpers/calibrationAndVerificationHelper");
const {filteredAssetMasterList} = require("../../../../models/finance/repository/assetMasterRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const CalibrationAndVerificationRepository = require("../../../../models/maintenance/repository/calibrationAndVerificationRepository");
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
                message: MESSAGES.apiSuccessStrings.ADDED("CalibrationAndVerification")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create CalibrationAndVerification", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getAll = async (req, res) => {
    try {
        let project = getAllCalibrationAndVerificationAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await CalibrationAndVerificationRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        console.error("getAll CalibrationAndVerification", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getById = async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("CalibrationAndVerification");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById CalibrationAndVerification", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("CalibrationAndVerification")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("CalibrationAndVerification");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById CalibrationAndVerification", e);
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
            message: MESSAGES.apiSuccessStrings.UPDATE("CalibrationAndVerification has been")
        });
    } catch (e) {
        console.error("update CalibrationAndVerification", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getAllMasterData = async (req, res) => {
    try {
        const calibrationResultOptions = await getAllModuleMaster(req.user.company, "CALIBRATION_RESULT");
        const calibrationAgencyOptions = await getAllModuleMaster(req.user.company, "CALIBRATION_AGENCY");
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
                    label: {$concat: ["$assetCode", " - ", "$assetName"]},
                    value: "$_id"
                }
            }
        ]);
        return res.success({
            calibrationResultOptions,
            calibrationAgencyOptions,
            equipmentListOptions
        });
    } catch (error) {
        console.error("getAllMasterData CalibrationAndVerification", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getAllReports = async (req, res) => {
    try {
        const equipmentType = await getAllModuleMaster(req.user.company, "EQUIPMENT_TYPE");
        const {equipmentCategory = null, toDate = null, fromDate = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!toDate &&
                !!fromDate && {
                    calibrationDate: {$gte: getStartDateTime(fromDate)},
                    calibrationDue: {
                        $lte: getEndDateTime(toDate)
                    }
                })
        };
        let project = getAllCalibrationAndVerificationReportsAttributes();
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
                $match: {
                    ...(!!equipmentCategory && {
                        "equipment.assetType": equipmentCategory
                    })
                }
            }
        ];
        let rows = await CalibrationAndVerificationRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            equipmentType,
            ...rows
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getAllCalibrationDueCount = async company => {
    const result = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$calibrationDue"}}
            }
        },
        {
            $match: {
                company: ObjectId(company),
                matchDate: {
                    $gte: dateToAnyFormat(getFirstDateOfMonth(), "YYYY-MM-DD"),
                    $lte: dateToAnyFormat(getLastDateOfMonth(), "YYYY-MM-DD")
                }
            }
        },
        {
            $group: {
                _id: null,
                count: {$sum: 1}
            }
        },
        {
            $project: {
                _id: 0,
                count: 1
            }
        }
    ]);
    return result[0]?.count || 0;
};

exports.getTotalNoOfInstrumentDueForCalibrationPerDay = async company => {
    try {
        const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
        const rows = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$calibrationDue"}}
                }
            },
            {
                $match: {
                    company: ObjectId(company),
                    matchDate: currentDate
                }
            },
            {
                $group: {
                    _id: null,
                    count: {$sum: 1}
                    // count: {$sum: {$cond: [{$eq: ["$status", "Awaiting Approval"]}, 1, 0]}}
                }
            },
            {
                $project: {
                    _id: 0,
                    count: 1
                }
            }
        ]);
        return rows[0]?.count || 0;
    } catch (error) {
        console.error("error", error);
    }
};
