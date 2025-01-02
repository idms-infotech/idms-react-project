const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/settings/SKUCategoryModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {OPTIONS} = require("../../../../helpers/global.options");
const {getAllSKUCategoryAttributes} = require("../../../../models/settings/helpers/SKUCategoryHelper");
const SKUCategoryRepository = require("../../../../models/settings/repository/SKUCategoryRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllSKUCategoryAttributes();
        let pipeline = [];
        let rows = await SKUCategoryRepository.getAllPaginate({
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
        const itemDetails = await SKUCategoryRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: "SKU Category has been created successfully"
            });
        }
    } catch (e) {
        console.error("create SKU Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await SKUCategoryRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;

        itemDetails = await SKUCategoryRepository.updateDoc(itemDetails, req.body);
        if (itemDetails) {
            res.success({
                message: "SKU Category has been updated successfully"
            });
        }
    } catch (e) {
        console.error("update SKU Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await SKUCategoryRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("SKU Category")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("SKU Category");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById SKU Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await SKUCategoryRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("SKU Category");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById SKU Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllSKUCategory = async (company, category, project = {}) => {
    try {
        let rows = await Model.find(
            {
                company: company,
                ...(!!category && {displayProductCategoryName: category}),
                categoryStatus: OPTIONS.defaultStatus.ACTIVE
            },
            project
        ).sort({order: 1});
        return rows;
    } catch (e) {
        console.error("getAllSKUCategory", e);
    }
};

exports.setSKUMasterAutoIncrementNo = async SKUCategory => {
    try {
        await Model.findOneAndUpdate(
            {
                displayProductCategoryName: SKUCategory
            },
            {$inc: {SKUCategoryAutoIncrement: 1}}
        );
    } catch (e) {
        console.error("setSKUMasterAutoIncrementNo", e);
    }
};
