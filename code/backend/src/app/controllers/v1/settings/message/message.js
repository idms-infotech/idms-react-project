const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/settings/messageModel");
const AutoIncrement = require("../../../../models/settings/autoIncrementModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {MESSAGE_MODULE_PREFIX} = require("../../../../helpers/moduleConstants");
const {generateCreateData} = require("../../../../helpers/global.options");
const {getAndSetAutoIncrementNo} = require("../autoIncrement/autoIncrement");
const {MESSAGE} = require("../../../../mocks/schemasConstant/settingsConstant");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        const {search = null} = req.query;
        let query = {
            company: req.user.company,
            ...(![undefined, null, ""].includes(search) && {$text: {$search: search}})
        };
        let rows = await getAllData(req, query, "withP");
        let count = await Model.countDocuments(query);
        return res.success({
            rows,
            count
        });
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
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
            await AutoIncrement.setNextId("Message", MESSAGE_MODULE_PREFIX, req.user.company);
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Message")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await Model.findById(req.params.id);
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await generateCreateData(itemDetails, req.body);

        itemDetails = await itemDetails.save();
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Message has been")
        });
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Message")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Message");
            res.preconditionFailed(errors);
            Ro;
        }
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Message");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(MESSAGE.AUTO_INCREMENT_DATA(), req.user.company);
        res.success({autoIncrementNo});
    } catch (error) {
        console.error("getAllMasterDataForUser", error);
        res.status(400);
        throw new Error("Invalid Model data");
    }
});

exports.getAllMessages = asyncHandler(async company => {
    let rows = await Model.find(
        {
            company: company
        },
        {messageCode: 1, messageName: 1}
    ).sort({createdAt: -1});
    return rows;
});
const getAllData = asyncHandler(async (req, query, flag) => {
    try {
        const {page = 1, pageSize = 10, search = null, column = "createdAt", direction = -1} = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let rows = [];

        if (flag == "withP") {
            rows = await Model.find(query)
                .limit(+pageSize)
                .skip(+skip)
                .sort({[column]: direction});
        } else {
            rows = await Model.find(query).sort({[column]: direction});
        }
        return rows;
    } catch (e) {
        console.error(e);
    }
});
