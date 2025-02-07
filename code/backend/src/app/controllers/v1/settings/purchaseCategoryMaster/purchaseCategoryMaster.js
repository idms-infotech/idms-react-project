const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/settings/purchaseCategoryModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {outputData, getAllAggregationFooter} = require("../../../../helpers/utility");
const {generateCreateData, getMatchData, OPTIONS} = require("../../../../helpers/global.options");
const {getAllPurchaseCategoryAttributes} = require("../../../../models/settings/helpers/purchaseCategoryHelper");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        const {
            search = null,
            excel = "false",
            page = 1,
            pageSize = 10,
            column = "createdAt",
            direction = -1
        } = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let project = getAllPurchaseCategoryAttributes();
        let match = await getMatchData(project, search);
        let pagination = [];
        if (excel == "false") {
            pagination = [{$skip: +skip}, {$limit: +pageSize}];
        }
        let rows = await Model.aggregate([...getAllAggregationFooter(project, match, column, direction, pagination)]);
        return res.success({
            ...outputData(rows)
        });
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
                message: "Purchase Category has been created successfully"
            });
        }
    } catch (e) {
        console.error("create Purchase Category", e);
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
                message: "Purchase Category has been updated successfully"
            });
        }
    } catch (e) {
        console.error("update Purchase Category", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("Purchase Category")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Purchase Category");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Purchase Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Purchase Category");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Purchase Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllPurchaseCategory = async (company, category) => {
    try {
        let rows = await Model.find({
            company: company,
            ...(!!category && {category: category}),
            categoryStatus: OPTIONS.defaultStatus.ACTIVE
        });
        return rows;
    } catch (e) {
        console.error("getAllPurchaseCategory", e);
    }
};

exports.setPurchaseNextAutoIncrementNo = async purchaseCategory => {
    try {
        await Model.findOneAndUpdate(
            {
                category: purchaseCategory
            },
            {$inc: {nextAutoIncrement: 1}}
        );
    } catch (e) {
        console.error("setPurchaseNextAutoIncrementNo", e);
    }
};
