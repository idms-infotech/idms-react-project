const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllProdItemCategoryAttributes} = require("../../../../models/settings/helpers/prodItemCategoryHelper");
const ProdItemCategoryRepository = require("../../../../models/settings/repository/prodItemCategoryRepository");
const {
    filteredProductionUnitConfigList
} = require("../../../../models/planning/repository/productionUnitConfigRepository");
const {ObjectId} = require("../../../../../config/mongoose");
const {OPTIONS} = require("../../../../helpers/global.options");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllProdItemCategoryAttributes();
        let pipeline = [
            {
                $match: {
                    type: req.query.type
                }
            }
        ];
        let rows = await ProdItemCategoryRepository.getAllPaginate({pipeline, project, queryParams: req.query});
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
        const itemDetails = await ProdItemCategoryRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Production Item")
            });
        }
    } catch (e) {
        console.error("create Production Item Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await ProdItemCategoryRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await ProdItemCategoryRepository.updateDoc(itemDetails, req.body);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.UPDATE("Production Item")
            });
        }
    } catch (e) {
        console.error("update Production Item Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await ProdItemCategoryRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Production Item Category")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Production Item Category");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Production Item Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const productionUnitOptions = await filteredProductionUnitConfigList([
            {
                $match: {
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.ACTIVE,
                    SKUFlag: {$ne: true}
                }
            },
            {
                $sort: {srNo: 1}
            },
            {
                $project: {
                    _id: 0,
                    label: {$concat: ["$prodUnitName", " ", "(", "$prodUnitCode", ")"]},
                    value: "$_id"
                }
            }
        ]);
        return res.success({productionUnitOptions});
    } catch (error) {
        console.error("getAllMasterData Invoice Payment", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await ProdItemCategoryRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Production Item Category");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Production Item Category", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllProdItemCategory = async pipeline => {
    try {
        return ProdItemCategoryRepository.filteredProdItemCategoryList(pipeline);
    } catch (e) {
        console.error("getAllProdItemCategory", e);
    }
};

exports.setProdItemNextAutoIncrementNo = async (category, type) => {
    try {
        await ProdItemCategoryRepository.findAndUpdateDoc(
            {
                category: category,
                type: type
            },
            {$inc: {nextAutoIncrement: 1}}
        );
    } catch (e) {
        console.error("setProdItemNextAutoIncrementNo", e);
    }
};
