const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllProductCategorySpecificationsAttributes
} = require("../../../../models/quality/helpers/productCategorySpecificationsHelper");
const ProductCategorySpecificationsRepository = require("../../../../models/quality/repository/productCategorySpecificationsRepository");
const {filteredProductCategoryMasterList} = require("../../../../models/settings/repository/productCategoryRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const {filteredSpecificationList} = require("../../../../models/quality/repository/specificationRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllProductCategorySpecificationsAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await ProductCategorySpecificationsRepository.getAllPaginate({
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
        const itemDetails = await ProductCategorySpecificationsRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Product Category Specifications")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Product Category Specifications", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await ProductCategorySpecificationsRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await ProductCategorySpecificationsRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Product Category Specifications has been")
        });
    } catch (e) {
        console.error("update Product Category Specifications", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await ProductCategorySpecificationsRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Product Category Specifications")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Product Category Specifications");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Product Category Specifications", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await ProductCategorySpecificationsRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Product Category Specifications");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Product Category Specifications", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const productCategoryList = await filteredProductCategoryMasterList([
            {$match: {company: ObjectId(req.user.company), categoryStatus: OPTIONS.defaultStatus.ACTIVE}},
            {$sort: {productNumber: 1}},
            {
                $project: {
                    productNumber: 1,
                    productCode: 1,
                    displayProductCategoryName: 1,
                    application: 1
                }
            }
        ]);
        const specificationList = await filteredSpecificationList([
            {$match: {company: ObjectId(req.user.company), status: OPTIONS.defaultStatus.ACTIVE}},
            {$sort: {createdAt: -1}},
            {
                $project: {
                    seq: null,
                    specValue: null,
                    tolerance: null,
                    LTL: null,
                    UTL: null,
                    specificationCode: 1,
                    characteristic: 1,
                    UOM: 1,
                    testStandard: 1,
                    measuringInstrument: 1
                }
            }
        ]);
        return res.success({productCategoryList, specificationList});
    } catch (error) {
        console.error("getAllMasterData Product Category Specifications", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
