const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/production/FGCorrectionModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData} = require("../../../../helpers/global.options");
const mongoose = require("mongoose");
const {getAllSKUs} = require("../../sales/SKU/SKU");
const {
    getAllFinishedGoodsInwardEntry,
    updateFGINOnRenameBatch,
    updateFGINOnBatchTransfer,
    updateFGINOnQuantityCorrection
} = require("../../stores/finishedGoodsInwardEntry/finishedGoodsInwardEntry");
const {getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const {
    getAllFGCorrectionAttributes,
    getAllFGCorrectionReportsAttributes
} = require("../../../../models/production/helpers/FGCorrectionHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {FG_CORRECTION} = require("../../../../mocks/schemasConstant/productionConstant");
const {filteredSKUMasterList} = require("../../../../models/sales/repository/SKUMasterRepository");
const FGCorrectionRepository = require("../../../../models/production/repository/FGCorrectionRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllFGCorrectionAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await FGCorrectionRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (e) {
        console.error("get All FG Correction", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

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
            if (itemDetails.correctionCategory == "Rename Batch") {
                await updateFGINOnRenameBatch(itemDetails.SKU, itemDetails.sourceBatch, itemDetails.newBatch);
            } else if (itemDetails.correctionCategory == "Batch Transfer") {
                await updateFGINOnBatchTransfer(
                    itemDetails.SKU,
                    itemDetails.sourceBatch,
                    itemDetails.destinationBatch,
                    itemDetails.transferQty
                );
            } else {
                await updateFGINOnQuantityCorrection(
                    itemDetails.SKU,
                    itemDetails.sourceBatch,
                    itemDetails.correctedQty
                );
            }
            res.success({
                message: `FG Correction has been created successfully`
            });
        }
    } catch (e) {
        console.error("create FG", e);
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
        if (itemDetails) {
            res.success({
                message: "FG Correction updated successfully"
            });
        }
    } catch (e) {
        console.error("update FG Correction", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("FG Correction")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("FG Correction");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById FG Correction", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("FG Correction");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById FG Correction", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getAllMasterData
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...FG_CORRECTION.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        const SKUOptions = await filteredSKUMasterList([
            {$match: {company: ObjectId(req.user.company), isActive: "A"}},
            {$sort: {createdAt: -1}},
            {$project: {SKUNo: 1, SKUDescription: 1, _id: 1}}
        ]);
        return res.success({autoIncrementNo, SKUOptions});
    } catch (error) {
        console.error("getAllMasterData FG Correction", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getFGCorrectionBySKUId = asyncHandler(async (req, res) => {
    try {
        const FGINList = await getAllFinishedGoodsInwardEntry(req.user.company, req.params.id);
        return res.success(FGINList);
    } catch (e) {
        console.error("getAllMasterData FG Correction", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllFGCorrectionHistoryReports = asyncHandler(async (req, res) => {
    try {
        const SKUList = await getAllSKUs(req.user.company, {SKUName: 1});
        const {SKU = null, fromDate = null, toDate = null} = req.query;
        let project = getAllFGCorrectionReportsAttributes();
        let query = {
            company: ObjectId(req.user.company),
            ...(!!SKU && {
                SKU: ObjectId(SKU)
            }),
            ...(!!toDate &&
                !!fromDate && {
                    createdAt: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let pipeline = [
            {
                $match: query
            },
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "SKU",
                    foreignField: "_id",
                    pipeline: [{$project: {SKUName: 1}}],
                    as: "SKU"
                }
            },
            {$unwind: "$SKU"},
            {
                $lookup: {
                    from: "FGIN",
                    localField: "destinationBatch",
                    foreignField: "_id",
                    pipeline: [{$project: {manufacturingDate: 1}}],
                    as: "destinationBatch"
                }
            },
            {
                $unwind: {
                    path: "$destinationBatch",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "FGIN",
                    localField: "sourceBatch",
                    foreignField: "_id",
                    pipeline: [{$project: {manufacturingDate: 1}}],
                    as: "sourceBatch"
                }
            },
            {
                $unwind: {
                    path: "$sourceBatch",
                    preserveNullAndEmptyArrays: true
                }
            }
        ];
        let rows = await FGCorrectionRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success({
            ...rows,
            SKUList
        });
    } catch (e) {
        console.error("getAllFGCorrectionHistoryReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
