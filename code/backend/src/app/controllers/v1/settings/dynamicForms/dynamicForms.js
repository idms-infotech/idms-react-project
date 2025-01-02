const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllDynamicFormsAttributes} = require("../../../../models/settings/helpers/dynamicFormsHelper");
const DynamicFormsRepository = require("../../../../models/settings/repository/dynamicFormsRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllDynamicFormsAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await DynamicFormsRepository.getAllPaginate({
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
        const itemDetails = await DynamicFormsRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Dynamic Forms")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Dynamic Forms", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await DynamicFormsRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await DynamicFormsRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Dynamic Forms has been")
        });
    } catch (e) {
        console.error("update Dynamic Forms", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await DynamicFormsRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Dynamic Forms")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Dynamic Forms");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Dynamic Forms", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await DynamicFormsRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Dynamic Forms");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Dynamic Forms", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        return res.success({});
    } catch (error) {
        console.error("getAllMasterData Dynamic Forms", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllDynamicForm = async (company, type) => {
    let rows = await DynamicFormsRepository.filteredDynamicFormsList([
        {
            $match: {company: ObjectId(company), type: type, status: OPTIONS.defaultStatus.ACTIVE}
        },
        {
            $sort: {order: 1}
        },
        {
            $project: {
                dynamicForm: "$_id",
                inputLabel: 1,
                inputType: 1,
                inputValue: 1,
                validations: 1,
                options: 1
            }
        }
    ]);
    return rows;
};
