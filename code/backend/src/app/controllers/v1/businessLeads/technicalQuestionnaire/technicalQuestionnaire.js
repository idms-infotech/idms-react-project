const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/businessLeads/technicalQuestionnaireModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, getMatchData} = require("../../../../helpers/global.options");
const {
    getAllTechnicalQuestionnaireAttributes
} = require("../../../../models/businessLeads/helpers/technicalQuestHelper");
const {
    getAllTechnicalQuestionnaireAggregate
} = require("../../../../models/businessLeads/repository/technicalQuestionnaireRepository");
const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllTechnicalQuestionnaireAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await getAllTechnicalQuestionnaireAggregate({
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
                message: MESSAGES.apiSuccessStrings.ADDED("TechnicalQuestionnaire")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create TechnicalQuestionnaire", e);
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
            message: MESSAGES.apiSuccessStrings.UPDATE("TechnicalQuestionnaire has been")
        });
    } catch (e) {
        console.error("update TechnicalQuestionnaire", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("TechnicalQuestionnaire");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById TechnicalQuestionnaire", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("TechnicalQuestionnaire")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("TechnicalQuestionnaire");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById TechnicalQuestionnaire", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllTechnicalQuestionnaire = async company => {
    try {
        let rows = await Model.aggregate([
            {$match: {company: ObjectId(company)}},
            {
                $group: {
                    _id: "$type",
                    data: {
                        $push: {
                            technicalQuestionnaire: "$_id",
                            orderNo: "$orderNo",
                            questionnaire: "$questionnaire"
                        }
                    }
                }
            },
            {
                $project: {
                    data: {
                        $sortArray: {input: "$data", sortBy: {orderNo: 1}}
                    },
                    _id: 1
                }
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllTechnicalQuestionnaire", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return errors;
    }
};
