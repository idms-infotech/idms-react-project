const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllServiceChargesAttributes} = require("../../../../models/settings/helpers/serviceChargesHelper");
const ServiceChargesRepository = require("../../../../models/settings/repository/serviceChargesRepository");
const {filteredSACMasterList} = require("../../../../models/purchase/repository/sacRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllServiceChargesAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await ServiceChargesRepository.getAllPaginate({
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
        const itemDetails = await ServiceChargesRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Service Charges")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Service Charges", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await ServiceChargesRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await ServiceChargesRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Service Charges has been")
        });
    } catch (e) {
        console.error("update Service Charges", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await ServiceChargesRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Service Charges")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Service Charges");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Service Charges", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await ServiceChargesRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Service Charges");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Service Charges", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const SACOptions = await filteredSACMasterList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isActive: "Y"
                }
            },
            {
                $project: {
                    SACCode: "$sacCode",
                    gstRate: 1,
                    igstRate: 1,
                    sgstRate: 1,
                    cgstRate: 1,
                    ugstRate: 1,
                    SAC: "$_id",
                    _id: 0
                }
            }
        ]);
        return res.success({SACOptions});
    } catch (error) {
        console.error("getAllMasterData Service Charges", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
