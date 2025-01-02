const Model = require("../../../../models/maintenance/qualityEquipmentModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {generateCreateData} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {
    getAllQualityEquipmentAttributes,
    getAllQualityEquipmentReportsAttributes
} = require("../../../../models/maintenance/helpers/qualityEquipmentHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {QUALITY_EQUIPMENT} = require("../../../../mocks/schemasConstant/maintenanceConstant");
const {
    getAllQualityEquipmentAggregate
} = require("../../../../models/maintenance/repository/qualityEquipmentRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {getAllDepartments} = require("../../settings/department/department");
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
                message: MESSAGES.apiSuccessStrings.ADDED("Quality Equipment")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Quality Equipment", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getAll = async (req, res) => {
    try {
        let project = getAllQualityEquipmentAttributes();
        if (req.query.excel == "true") {
            project = getAllQualityEquipmentReportsAttributes();
        }
        let pipeline = [
            {$match: {company: ObjectId(req.user.company)}},
            {
                $addFields: {
                    calibrationDateS: {$dateToString: {format: "%d-%m-%Y", date: "$calibrationDate"}},
                    calibrationDueS: {$dateToString: {format: "%d-%m-%Y", date: "$calibrationDue"}}
                }
            }
        ];
        let rows = await getAllQualityEquipmentAggregate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        console.error("getAllAsset", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getById = async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Quality Equipment");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Quality Equipment", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("Quality Equipment")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Quality Equipment");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Quality Equipment", e);
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
            message: MESSAGES.apiSuccessStrings.UPDATE("Quality Equipment has been")
        });
    } catch (e) {
        console.error("update Quality Equipment", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getAllMasterData = async (req, res) => {
    try {
        let locationOptions = await getAllModuleMaster(req.user.company, "LOCATION");
        const empDepartments = await getAllDepartments(req.user.company, {
            label: "$departmentName",
            value: "$departmentName",
            _id: 0
        });
        const equipmentTypeOptions = await getAllModuleMaster(req.user.company, "QUALITY_EQUIPMENT_TYPE");
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...QUALITY_EQUIPMENT.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        return res.success({
            empDepartmentsOptions: empDepartments,
            locationOptions,
            equipmentTypeOptions,
            autoIncrementNo
        });
    } catch (error) {
        console.error("getAllMasterData Quality Equipment", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getAllQualityEquipmentCount = async company => {
    try {
        const result = await Model.aggregate([
            {
                $match: {
                    company: ObjectId(company),
                    status: "Active"
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
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};
