const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllUOMUnitMasterAttributes} = require("../../../../models/settings/helpers/UOMUnitMasterHelper");
const UOMUnitMasterRepository = require("../../../../models/settings/repository/UOMUnitMasterRepository");
const {OPTIONS} = require("../../../../helpers/global.options");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let rows = await UOMUnitMasterRepository.filteredUOMUnitMasterList([
            {$match: {company: ObjectId(req.user.company)}},
            {
                $sort: {order: 1}
            }
        ]);
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
        const itemDetails = await UOMUnitMasterRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("UOM Unit Master")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create UOM Unit Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        for await (const ele of req.body) {
            let itemDetails = await UOMUnitMasterRepository.getDocById(ele._id);
            if (itemDetails) {
                itemDetails.updatedBy = req.user.sub;
                itemDetails = await UOMUnitMasterRepository.updateDoc(itemDetails, ele);
            }
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("UOM Unit Master has been")
        });
    } catch (e) {
        console.error("update UOM Unit Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await UOMUnitMasterRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("UOM Unit Master")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("UOM Unit Master");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById UOM Unit Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await UOMUnitMasterRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("UOM Unit Master");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById UOM Unit Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
    } catch (error) {
        console.error("getAllMasterData UOM Unit Master", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.purchaseUOMPipe = async (value, company) => {
    const UOMUintMasterOptions = await UOMUnitMasterRepository.filteredUOMUnitMasterList([
        {
            $match: {
                company: ObjectId(company),
                status: OPTIONS.defaultStatus.ACTIVE
            }
        },
        {
            $sort: {order: 1}
        },
        {
            $project: {
                label: 1,
                value: 1,
                _id: 0
            }
        }
    ]);
    let neValue = UOMUintMasterOptions.find(ele => ele.value == value)?.label;
    return neValue;
};
