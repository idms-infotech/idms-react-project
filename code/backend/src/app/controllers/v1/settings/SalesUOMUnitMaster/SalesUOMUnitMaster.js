const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const SalesUOMUnitMasterRepository = require("../../../../models/settings/repository/SalesUOMUnitMasterRepository");
const {OPTIONS} = require("../../../../helpers/global.options");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let rows = await SalesUOMUnitMasterRepository.filteredSalesUOMUnitMasterList([
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
        const itemDetails = await SalesUOMUnitMasterRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Sales UOM Unit Master")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Sales UOM Unit Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        for await (const ele of req.body) {
            let itemDetails = await SalesUOMUnitMasterRepository.getDocById(ele._id);
            if (itemDetails) {
                itemDetails.updatedBy = req.user.sub;
                itemDetails = await SalesUOMUnitMasterRepository.updateDoc(itemDetails, ele);
            }
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Sales UOM Unit Master has been")
        });
    } catch (e) {
        console.error("update Sales UOM Unit Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await SalesUOMUnitMasterRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Sales UOM Unit Master")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Sales UOM Unit Master");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Sales UOM Unit Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await SalesUOMUnitMasterRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Sales UOM Unit Master");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Sales UOM Unit Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
    } catch (error) {
        console.error("getAllMasterData Sales UOM Unit Master", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.salesUOMPipe = async (value, company) => {
    const UOMUintMasterOptions = await SalesUOMUnitMasterRepository.filteredSalesUOMUnitMasterList([
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
