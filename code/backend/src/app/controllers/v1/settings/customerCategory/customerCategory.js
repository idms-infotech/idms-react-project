const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllCustomerCategoryAttributes} = require("../../../../models/settings/helpers/customerCategoryHelper");
const CustomerCategoryRepository = require("../../../../models/settings/repository/customerCategoryRepository");
const {OPTIONS} = require("../../../../helpers/global.options");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllCustomerCategoryAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await CustomerCategoryRepository.getAllPaginate({
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
        const itemDetails = await CustomerCategoryRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Customer Category")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Customer Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await CustomerCategoryRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await CustomerCategoryRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Customer Category has been")
        });
    } catch (e) {
        console.error("update Customer Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await CustomerCategoryRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Customer Category")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Customer Category");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Customer Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await CustomerCategoryRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Customer Category");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Customer Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllCustomerCategory = async (company, project = {__v: 0}) => {
    try {
        let rows = await CustomerCategoryRepository.filteredCustomerCategoryList([
            {
                $match: {
                    company: ObjectId(company),
                    categoryStatus: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {$project: project},
            {$sort: {order: 1}}
        ]);
        return rows;
    } catch (e) {
        console.error("getAllCustomerCategory", e);
    }
};

exports.getAllCheckedCustomerCategoriesList = async match => {
    try {
        let rows = await CustomerCategoryRepository.filteredCustomerCategoryList([
            {
                $match: match
            },
            {
                $project: {category: 1}
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllCheckedCustomerCategoriesList", e);
    }
};

exports.setCustomerNextAutoIncrementNo = async itemCategory => {
    try {
        await CustomerCategoryRepository.findAndUpdateDoc(
            {
                category: itemCategory
            },
            {$inc: {nextAutoIncrement: 1}}
        );
    } catch (e) {
        console.error("setCustomerNextAutoIncrementNo", e);
    }
};
