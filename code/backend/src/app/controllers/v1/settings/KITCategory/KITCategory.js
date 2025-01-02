const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllKITCategoryAttributes} = require("../../../../models/settings/helpers/KITCategoryHelper");
const KITCategoryRepository = require("../../../../models/settings/repository/KITCategoryRepository");
const {OPTIONS} = require("../../../../helpers/global.options");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllKITCategoryAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await KITCategoryRepository.getAllPaginate({
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
        const itemDetails = await KITCategoryRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("KIT Category")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create KIT Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await KITCategoryRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await KITCategoryRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("KIT Category has been")
        });
    } catch (e) {
        console.error("update KIT Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await KITCategoryRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("KIT Category")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("KIT Category");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById KIT Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await KITCategoryRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("KIT Category");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById KIT Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllKITCategory = async (company, category, project = {__v: 0}) => {
    try {
        let rows = await KITCategoryRepository.filteredKITCategoryList([
            {
                $match: {
                    company: ObjectId(company),
                    ...(!!category && {displayCategoryName: category}),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $sort: {order: 1}
            },
            {
                $project: project
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllKITCategory", e);
    }
};

exports.setKITMasterAutoIncrementNo = async category => {
    try {
        await KITCategoryRepository.findAndUpdateDoc(
            {
                displayProductCategoryName: category
            },
            {$inc: {autoIncrementNo: 1}}
        );
    } catch (e) {
        console.error("setKITMasterAutoIncrementNo", e);
    }
};
