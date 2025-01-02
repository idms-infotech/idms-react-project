const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllInvZoneConfigAttributes} = require("../../../../models/planning/helpers/invZoneConfigHelper");
const InvZoneConfigRepository = require("../../../../models/planning/repository/invZoneConfigRepository");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllInvZoneConfigAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company)}},
            {
                $addFields: {
                    revisionNo: {$toString: "$revisionInfo.revisionNo"}
                }
            }
        ];
        let rows = await InvZoneConfigRepository.getAllPaginate({
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
        const itemDetails = await InvZoneConfigRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Inv Zone Config")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Inv Zone Config", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await InvZoneConfigRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await InvZoneConfigRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Inv Zone Config has been")
        });
    } catch (e) {
        console.error("update Inv Zone Config", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await InvZoneConfigRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Inv Zone Config")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Inv Zone Config");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Inv Zone Config", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await InvZoneConfigRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Inv Zone Config");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Inv Zone Config", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.bulkUpdate = asyncHandler(async (req, res) => {
    try {
        for await (const ele of req.body) {
            await InvZoneConfigRepository.findAndUpdateDoc(
                {
                    _id: ele?._id
                },
                {
                    srNo: ele?.srNo
                }
            );
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Inv Zone Config has been")
        });
    } catch (e) {
        console.error("update Inv Zone Config", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
