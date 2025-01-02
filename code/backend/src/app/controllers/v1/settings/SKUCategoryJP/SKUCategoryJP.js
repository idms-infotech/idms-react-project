const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllSKUCategoryJPAttributes} = require("../../../../models/settings/helpers/SKUCategoryJPHelper");
const SKUCategoryJPRepository = require("../../../../models/settings/repository/SKUCategoryJPRepository");
const {OPTIONS} = require("../../../../helpers/global.options");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllSKUCategoryJPAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await SKUCategoryJPRepository.getAllPaginate({
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
        const itemDetails = await SKUCategoryJPRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("SKU Category JP")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create SKU Category JP", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await SKUCategoryJPRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await SKUCategoryJPRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("SKU Category JP has been")
        });
    } catch (e) {
        console.error("update SKU Category JP", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await SKUCategoryJPRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("SKU Category JP")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("SKU Category JP");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById SKU Category JP", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await SKUCategoryJPRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("SKU Category JP");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById SKU Category JP", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllSKUCategoryJP15 = async (company, category, project = {__v: 0}) => {
    try {
        let rows = await SKUCategoryJPRepository.filteredSKUCategoryJPList([
            {
                $match: {
                    company: ObjectId(company),
                    ...(!!category && {displayProductCategoryName: category}),
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $project: project
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllSKUCategory", e);
    }
};

exports.setSKUMasterJPAutoIncrementNo = async SKUCategory => {
    try {
        await SKUCategoryJPRepository.findAndUpdateDoc(
            {
                displayProductCategoryName: SKUCategory
            },
            {$inc: {SKUCategoryAutoIncrement: 1}}
        );
    } catch (e) {
        console.error("setSKUMasterJPAutoIncrementNo", e);
    }
};
