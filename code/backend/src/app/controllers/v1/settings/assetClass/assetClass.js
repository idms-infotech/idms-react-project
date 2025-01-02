const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {OPTIONS} = require("../../../../helpers/global.options");
const {getAllAssetClassAttributes} = require("../../../../models/settings/helpers/assetClassHelper");
const {ObjectId} = require("../../../../../config/mongoose");
const AssetClassRepository = require("../../../../models/settings/repository/assetClassRepository");
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllAssetClassAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await AssetClassRepository.getAllPaginate({
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
        const itemDetails = await AssetClassRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: "Asset Class has been created successfully"
            });
        }
    } catch (e) {
        console.error("create Asset Class", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await AssetClassRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await AssetClassRepository.updateDoc(itemDetails, req.body);
        if (itemDetails) {
            res.success({
                message: "Asset Class has been updated successfully"
            });
        }
    } catch (e) {
        console.error("update Asset Class", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await AssetClassRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Asset Class")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Asset Class");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Asset Class", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await AssetClassRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Asset Class");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Asset Class", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAssetClassById = async (company, assetClassId = null, project = {}) => {
    try {
        let rows = await AssetClassRepository.findOneDoc(
            {
                ...(!!assetClassId && {_id: assetClassId}),
                company: company,
                status: OPTIONS.defaultStatus.ACTIVE
            },
            project
        );
        return rows;
    } catch (e) {
        console.error("getAssetClassById", e);
    }
};

exports.getAllAssetClassList = async (company, project = {}) => {
    try {
        let rows = await AssetClassRepository.filteredAssetClassList([
            {
                $match: {
                    company: ObjectId(company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $sort: {
                    order: 1
                }
            },
            {
                $project: project
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllAssetClassList", e);
    }
};

exports.getAllCheckedAssetCategoriesList = async match => {
    try {
        let rows = await AssetClassRepository.filteredAssetClassList([
            {
                $match: match
            },
            {
                $project: {assetClassName: 1}
            }
        ]);
        return rows;
    } catch (e) {
        console.error("getAllCheckedAssetCategoriesList", e);
    }
};

exports.setAssetsClassNextAutoIncrementNo = async assetClassId => {
    try {
        await AssetClassRepository.findAndUpdateDoc(
            {
                _id: assetClassId
            },
            {$inc: {nextAutoIncrement: 1}}
        );
    } catch (e) {
        console.error("setAssetsClassNextAutoIncrementNo", e);
    }
};
