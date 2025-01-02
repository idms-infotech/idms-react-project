const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/supports/minutesOfMeetingModel");
const AutoIncrement = require("../../../../models/settings/autoIncrementModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAutoIncrementNumber, outputData, getAllAggregationFooter} = require("../../../../helpers/utility");
const {generateCreateData, getMatchData} = require("../../../../helpers/global.options");
const {getAllMinutesOfMeetAttributes} = require("../../../../models/supports/helpers/minutesOfMeetingHelper");
const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

// @desc    getAll Minutes Of Meeting Record
exports.getAll = asyncHandler(async (req, res) => {
    try {
        const {
            search = null,
            excel = "false",
            page = 1,
            pageSize = 10,
            column = "createdAt",
            direction = -1
        } = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let project = getAllMinutesOfMeetAttributes();
        let match = await getMatchData(project, search);
        let pagination = [];
        if (excel == "false") {
            pagination = [{$skip: +skip}, {$limit: +pageSize}];
        }
        let rows = await Model.aggregate([
            {$match: {company: ObjectId(req.user.company)}},
            ...getAllAggregationFooter(project, match, column, direction, pagination)
        ]);
        return res.success({
            ...outputData(rows)
        });
    } catch (e) {
        console.error("Minutes Of Meeting", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
// @desc    create Minutes Of Meeting new Record
exports.create = asyncHandler(async (req, res) => {
    try {
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const saveObj = new Model(createdObj);
        await saveObj.save();
        return res.success({
            message: MESSAGES.apiSuccessStrings.ADDED("Minutes Of Meeting")
        });
    } catch (e) {
        console.error("create Minutes Of Meeting", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    update Minutes Of Meeting  Record
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
            message: MESSAGES.apiSuccessStrings.UPDATE("Minutes Of Meeting")
        });
    } catch (e) {
        console.error("update Minutes Of Meeting", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    deleteById Minutes Of Meeting Record
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Minutes Of Meeting")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Minutes Of Meeting");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Minutes Of Meeting", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getById Minutes Of Meeting Record
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Minutes Of Meeting");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Minutes Of Meeting", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getAllMasterData Minutes Of Meeting Record
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementedNo = await AutoIncrement.getNextId("Minutes Of Meeting", "MoM/", req.user.company);
        let autoIncrementNo = getAutoIncrementNumber("MoM/", "", autoIncrementedNo, 4);
        return res.success({
            autoIncrementNo
        });
    } catch (error) {
        console.error("getAllMasterData Minutes Of Meeting", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllMinutesOfMeeting = asyncHandler(async company => {
    try {
        let rows = await Model.find({
            company: company
        }).sort({createdAt: -1});
        return rows;
    } catch (e) {
        console.error("getAllMinutesOfMeeting", e);
    }
});
