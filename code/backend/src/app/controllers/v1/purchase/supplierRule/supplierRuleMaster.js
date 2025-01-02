const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/purchase/supplierRuleModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, getMatchData} = require("../../../../helpers/global.options");
const {getAllSupplierRuleAttributes} = require("../../../../models/purchase/helpers/supplierRuleHelper");
const SupplierRuleRepository = require("../../../../models/purchase/repository/supplierRuleRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllSupplierRuleAttributes();
        let rows = await SupplierRuleRepository.getAllPaginate({
            pipeline: [],
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
            res.success({
                message: "Supplier Evaluation has been created successfully"
            });
        }
    } catch (e) {
        console.error("create Supplier Evaluation", e);
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
        if (itemDetails) {
            res.success({
                message: "Supplier Evaluation has been updated successfully"
            });
        }
    } catch (e) {
        console.error("update Supplier Evaluation", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("Supplier Evaluation")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Supplier Evaluation");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Supplier Evaluation", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Supplier Evaluation");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Supplier Evaluation", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllSupplierRules = asyncHandler(async company => {
    try {
        let rows = await Model.find({
            company: company,
            enabled: "Active"
        });
        return rows;
    } catch (e) {
        console.error("getAllSupplierRules", e);
    }
});
