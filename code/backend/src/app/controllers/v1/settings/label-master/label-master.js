const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {default: mongoose} = require("mongoose");
const {getAllLabelMasterAttributes} = require("../../../../models/settings/helpers/labelMasterHelper");
const memoryCacheHandler = require("../../../../utilities/memoryCacheHandler");
const LabelMasterRepository = require("../../../../models/settings/repository/labelMasterRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        const {menuItemId = null} = req.query;
        let project = getAllLabelMasterAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    menuItemId: ObjectId(menuItemId)
                }
            }
        ];
        let rows = await LabelMasterRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success({
            ...rows
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
        const itemDetails = await LabelMasterRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Label Master")
            });
            await this.updateCacheGlobalLabel(req.user.company);
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
        let itemDetails = await LabelMasterRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails = await LabelMasterRepository.updateDoc(itemDetails, req.body);
        res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Label Master has been")
        });
        await this.updateCacheGlobalLabel(req.user.company);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await LabelMasterRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Label Master")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Label Master");
            res.preconditionFailed(errors);
        }
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await LabelMasterRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Label Master");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.getAllLabelJSON = async company => {
    try {
        let rows = [];
        const cachedData = memoryCacheHandler.get("labelMaster");
        if (cachedData) {
            rows = cachedData;
        } else {
            rows = await this.updateCacheGlobalLabel(company);
        }
        return rows;
    } catch (e) {
        console.error(e);
    }
};

exports.updateCacheGlobalLabel = async company => {
    try {
        let rows = await LabelMasterRepository.filteredLabelList([
            {
                $match: {
                    company: ObjectId(company)
                }
            },
            {
                $project: {
                    menuItemId: 1,
                    labelName: 1,
                    displayLabelName: 1
                }
            }
        ]);
        memoryCacheHandler.put("labelMaster", rows);
        return rows;
    } catch (error) {
        console.error(error);
    }
};
