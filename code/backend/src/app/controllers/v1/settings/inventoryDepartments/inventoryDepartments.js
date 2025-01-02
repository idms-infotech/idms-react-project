const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {
    getAllInventoryDepartmentsAttributes
} = require("../../../../models/settings/helpers/inventoryDepartmentsHelper");
const InventoryDepartmentsRepository = require("../../../../models/settings/repository/inventoryDepartmentsRepository");
const {GOODS_TRANSFER_REQUEST_DEPT} = require("../../../../mocks/constantData");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllInventoryDepartmentsAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await InventoryDepartmentsRepository.getAllPaginate({
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
        const itemDetails = await InventoryDepartmentsRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Inventory Departments")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Inventory Departments", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await InventoryDepartmentsRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await InventoryDepartmentsRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Inventory Departments has been")
        });
    } catch (e) {
        console.error("update Inventory Departments", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await InventoryDepartmentsRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Inventory Departments")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Inventory Departments");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Inventory Departments", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await InventoryDepartmentsRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Inventory Departments");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Inventory Departments", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        return res.success({
            departmentsOptions: [
                {label: GOODS_TRANSFER_REQUEST_DEPT.PLANNING, value: GOODS_TRANSFER_REQUEST_DEPT.PLANNING},
                {label: GOODS_TRANSFER_REQUEST_DEPT.PRODUCTION, value: GOODS_TRANSFER_REQUEST_DEPT.PRODUCTION},
                {label: GOODS_TRANSFER_REQUEST_DEPT.STORES, value: GOODS_TRANSFER_REQUEST_DEPT.STORES}
                // {label: GOODS_TRANSFER_REQUEST_DEPT.QUALITY, value: GOODS_TRANSFER_REQUEST_DEPT.QUALITY}
            ]
        });
    } catch (error) {
        console.error("getAllMasterData Inventory Departments", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
