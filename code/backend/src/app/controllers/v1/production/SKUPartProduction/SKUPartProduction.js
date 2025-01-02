const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/production/SKUPartProductionModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, getMatchData} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {getAllMapProcessMachine} = require("../map-process-machine/map-process-machine");
const {getAllSKUPartProductionAttributes} = require("../../../../models/production/helpers/SKUPartProductionHelper");
const {dateToAnyFormat} = require("../../../../helpers/dateTime");
const {SKU_PART_PRODUCTION} = require("../../../../mocks/schemasConstant/productionConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {filteredSKUMasterList} = require("../../../../models/sales/repository/SKUMasterRepository");
const {getAllSKUPartProdAggregate} = require("../../../../models/production/repository/SKUPartProductionRepository");
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
                message: MESSAGES.apiSuccessStrings.ADDED("SKU Part Production")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create SKU Part Production", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllSKUPartProductionAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await getAllSKUPartProdAggregate({pipeline, project, queryParams: req.query});
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
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("SKU Part Production");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById  SKU Part Production", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("SKU Part Production")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("SKU Part Production");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById  SKU Part Production", e);
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
        if (req.body.SKUPartProductionDetails) {
            itemDetails.SKUPartProductionDetails = req.body.SKUPartProductionDetails;
        }
        itemDetails = await itemDetails.save();

        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE(" SKU Part Production has been")
        });
    } catch (e) {
        console.error("update  SKU Part Production", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const SKUOptions = await filteredSKUMasterList([
            {$match: {company: ObjectId(req.user.company), isActive: "A"}},
            {$sort: {createdAt: -1}},
            {
                $project: {
                    SKUNo: 1,
                    SKUDescription: 1,
                    _id: 1,
                    SKU: "$_id",
                    SKUCode: "$SKUNo",
                    SKUName: 1,
                    SKUDescription: 1,
                    UOM: "$primaryUnit",
                    orderRef: null,
                    jobCard: null,
                    batchNumber: null,
                    batchQty: null,
                    outputQty: null,
                    rejectedQty: null
                }
            }
        ]);
        const mapProcessMachineListOptions = await getAllMapProcessMachine(req.user.company);
        const productionShiftOptions = await getAllModuleMaster(req.user.company, "PRODUCTION_SHIFT");
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...SKU_PART_PRODUCTION.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        return res.success({
            SKUOptions,
            autoIncrementNo,
            mapProcessMachineListOptions,
            productionShiftOptions
        });
    } catch (error) {
        console.error("getAllMasterData SKU Part Production", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getTotalNoOfSKUProducedPerDay = async company => {
    try {
        const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
        const rows = await Model.aggregate([
            {
                $addFields: {
                    matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$productionDate"}}
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
                    // count: {$sum: 1},
                    count: {$sum: {$cond: [{$eq: ["$status", "Awaiting Approval"]}, 1, 0]}}
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
