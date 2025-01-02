const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllProcessSpecByProdCategoryAttributes
} = require("../../../../models/finance/helpers/processSpecByProdCategoryHelper");
const ProcessSpecByProdCategoryRepository = require("../../../../models/finance/repository/processSpecByProdCategoryRepository");
const {filteredProductCategoryMasterList} = require("../../../../models/settings/repository/productCategoryRepository");
const {filteredProcessMasterList} = require("../../../../models/planning/repository/processMasterRepository");
const {OPTIONS} = require("../../../../helpers/global.options");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllProcessSpecByProdCategoryAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await ProcessSpecByProdCategoryRepository.getAllPaginate({
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
        let exists = await ProcessSpecByProdCategoryRepository.findOneDoc({
            productCategory: req.body.productCategory
        });
        if (exists) {
            let errors = "Process Specification already exists with this same Product Category";
            return res.preconditionFailed(errors);
        }
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const itemDetails = await ProcessSpecByProdCategoryRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Process Specification By Product Category")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Process Specification By Product Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await ProcessSpecByProdCategoryRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await ProcessSpecByProdCategoryRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Process Specification By Product Category has been")
        });
    } catch (e) {
        console.error("update Process Specification By Product Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await ProcessSpecByProdCategoryRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Process Specification By Product Category")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Process Specification By Product Category");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Process Specification By Product Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await ProcessSpecByProdCategoryRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Process Specification By Product Category");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Process Specification By Product Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const productCategoryOptions = await filteredProductCategoryMasterList([
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
        const processMasterList = await filteredProcessMasterList([
            {
                $match: {
                    company: ObjectId(req.user.company)
                }
            },
            {
                $project: {
                    _id: 0,
                    process: "$_id",
                    processId: 1,
                    processName: 1,
                    unitProcessOutput: 1,
                    allocationOfSkilledLabour: 1,
                    allocationOfSemiSkilledLabour: 1,
                    allocationOfUnSkilledLabour: 1,
                    totalLabourHeadCount: 1,
                    labourRatePerHr: "$totalRatePerHr",
                    totalAllocatedAssetCostPerHr: 1
                }
            }
        ]);
        return res.success({productCategoryOptions, processMasterList});
    } catch (error) {
        console.error("getAllMasterData Process Specification By Product Category", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
