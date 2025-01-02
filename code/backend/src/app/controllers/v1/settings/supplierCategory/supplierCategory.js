const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllSupplierCategoryAttributes} = require("../../../../models/settings/helpers/supplierCategoryHelper");
const SupplierCategoryRepository = require("../../../../models/settings/repository/supplierCategoryRepository");
const {OPTIONS} = require("../../../../helpers/global.options");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllSupplierCategoryAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await SupplierCategoryRepository.getAllPaginate({
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
        const itemDetails = await SupplierCategoryRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Supplier Category")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Supplier Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await SupplierCategoryRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await SupplierCategoryRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Supplier Category has been")
        });
    } catch (e) {
        console.error("update Supplier Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await SupplierCategoryRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Supplier Category")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Supplier Category");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Supplier Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await SupplierCategoryRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Supplier Category");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Supplier Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllSupplierCategory = async (company, project = {__v: 0}) => {
    try {
        let rows = await SupplierCategoryRepository.filteredSupplierCategoryList([
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
        console.error("getAlSupplierCategory", e);
    }
};

exports.getAllCheckedSupplierCategoriesList = async match => {
    try {
        let rows = await SupplierCategoryRepository.filteredSupplierCategoryList([
            {
                $match: match
            },
            {
                $project: {category: 1}
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllCheckedSupplierCategoriesList", e);
    }
};

exports.setSupplierNextAutoIncrementNo = async itemCategory => {
    try {
        await SupplierCategoryRepository.findAndUpdateDoc(
            {
                category: itemCategory
            },
            {$inc: {nextAutoIncrement: 1}}
        );
    } catch (e) {
        console.error("setSupplierNextAutoIncrementNo", e);
    }
};
