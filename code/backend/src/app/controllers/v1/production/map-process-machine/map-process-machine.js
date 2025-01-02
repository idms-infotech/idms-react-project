const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/production/mapProcessAndMachineModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {getAllAssetMasterList} = require("../../finance/assetMaster/assetMaster");
const {ASSET_CLASS_NAMES} = require("../../../../mocks/constantData");
const {MAP_PROCESS_AND_MACHINE} = require("../../../../mocks/schemasConstant/productionConstant");
const {
    getAllMapProcessAndMachineAttributes
} = require("../../../../models/production/helpers/mapProcessAndMachineHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {filteredProcessNameMasterList} = require("../../../../models/settings/repository/processNameRepository");
const {
    getAllMapProcessAndMachineAggregate
} = require("../../../../models/production/repository/mapProcessAndMachineRepository");
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
                message: MESSAGES.apiSuccessStrings.ADDED("Map Process And Machine")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Map Process And Machine", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllMapProcessAndMachineAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company)
                }
            },
            {
                $unwind: "$machineDetails"
            },
            {
                $group: {
                    _id: {
                        _id: "$_id",
                        mapCode: "$mapCode",
                        processName: "$processName"
                    },
                    noOfMachines: {$sum: 1}
                }
            }
        ];
        let rows = await getAllMapProcessAndMachineAggregate({pipeline, project, queryParams: req.query});
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
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Map Process And Machine");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Map Process And Machine", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("Map Process And Machine")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Map Process And Machine");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Map Process And Machine", e);
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
        if (req.body.machineDetails) {
            itemDetails.machineDetails = req.body.machineDetails;
        }
        itemDetails = await itemDetails.save();

        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Map Process And Machine has been")
        });
    } catch (e) {
        console.error("update Map Process And Machine", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const machineOptions = await getAllAssetMasterList(req.user.company, ASSET_CLASS_NAMES.MACHINES, {
            assetCode: 1,
            assetName: 1,
            assetDescription: 1,
            assetType: 1
        });
        const processOptions = await filteredProcessNameMasterList([
            {$match: {company: ObjectId(req.user.company), status: OPTIONS.defaultStatus.ACTIVE}},
            {$sort: {order: 1}},
            {
                $project: {
                    _id: 1,
                    processCode: 1,
                    processName: 1
                }
            }
        ]);
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            MAP_PROCESS_AND_MACHINE.AUTO_INCREMENT_DATA(),
            req.user.company
        );
        return res.success({
            autoIncrementNo,
            processOptions,
            machineOptions
        });
    } catch (error) {
        console.error("getAllMasterData Map Process And Machine", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMapProcessMachine = async company => {
    try {
        let rows = await Model.find(
            {
                status: OPTIONS.defaultStatus.ACTIVE,
                company: company
            },
            {
                process: 1,
                processCode: 1,
                processName: 1,
                machineDetails: {
                    $map: {
                        input: "$machineDetails",
                        as: "machineDetails",
                        in: {
                            machine: "$$machineDetails.machine",
                            machineCode: "$$machineDetails.machineCode",
                            machineName: "$$machineDetails.machineName"
                        }
                    }
                }
            }
        ).sort({createdAt: 1});
        return rows;
    } catch (e) {
        console.error("getAllMapProcessMachine", e);
    }
};
