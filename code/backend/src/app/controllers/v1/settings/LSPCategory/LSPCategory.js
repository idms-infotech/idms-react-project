const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllLSPCategoryAttributes} = require("../../../../models/settings/helpers/LSPCategoryHelper");
const LSPCategoryRepository = require("../../../../models/settings/repository/LSPCategoryRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllLSPCategoryAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await LSPCategoryRepository.getAllPaginate({
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
        const itemDetails = await LSPCategoryRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("LSP Category")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create LSP Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await LSPCategoryRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await LSPCategoryRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("LSP Category has been")
        });
    } catch (e) {
        console.error("update LSP Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await LSPCategoryRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("LSP Category")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("LSP Category");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById LSP Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await LSPCategoryRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("LSP Category");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById LSP Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllLSPCategory = async pipeline => {
    try {
        return LSPCategoryRepository.filteredLSPCategoryList(pipeline);
    } catch (e) {
        console.error("getAllLSPCategory", e);
    }
};

exports.setLSPNextAutoIncrementNo = async category => {
    try {
        await LSPCategoryRepository.findAndUpdateDoc(
            {
                category: category
            },
            {$inc: {nextAutoIncrement: 1}}
        );
    } catch (e) {
        console.error("setLSPNextAutoIncrementNo", e);
    }
};
