const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllItemCategoryJPAttributes} = require("../../../../models/settings/helpers/itemCategoryJPHelper");
const ItemCategoryJPRepository = require("../../../../models/settings/repository/itemCategoryJPRepository");
const {OPTIONS} = require("../../../../helpers/global.options");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllItemCategoryJPAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await ItemCategoryJPRepository.getAllPaginate({
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
        const itemDetails = await ItemCategoryJPRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Item Category JP")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Item Category JP", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await ItemCategoryJPRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await ItemCategoryJPRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Item Category JP has been")
        });
    } catch (e) {
        console.error("update Item Category JP", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await ItemCategoryJPRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Item Category JP")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Item Category JP");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Item Category JP", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await ItemCategoryJPRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Item Category JP");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Item Category JP", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllItemCategoryJP = async (company, project = {__v: 0}) => {
    try {
        let rows = await ItemCategoryJPRepository.filteredItemCategoryJPList([
            {
                $match: {
                    company: ObjectId(company),
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {$project: project},
            {$sort: {category: 1}}
        ]);
        return rows;
    } catch (e) {
        console.error("getAllItemCategoryJP", e);
    }
};
exports.getAllCheckedItemJPList = async match => {
    try {
        let rows = await ItemCategoryJPRepository.filteredItemCategoryJPList([
            {
                $match: match
            },
            {
                $project: {category: 1}
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllCheckedItemCategoriesList", e);
    }
};

exports.setItemsJPNextAutoIncrementNo = async itemCategory => {
    try {
        await ItemCategoryJPRepository.findAndUpdateDoc(
            {
                category: itemCategory
            },
            {$inc: {nextAutoIncrement: 1}}
        );
    } catch (e) {
        console.error("setItemsJPNextAutoIncrementNo", e);
    }
};
