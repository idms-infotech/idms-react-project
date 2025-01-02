const asyncHandler = require("express-async-handler");
const Model = require("../../../../../models/planning/billOfMaterialModels/BoMOfProductModel");
const MESSAGES = require("../../../../../helpers/messages.options");
const {generateCreateData, OPTIONS} = require("../../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const ProdItemMaster = require("../../prodItemMaster/prodItemMaster");
const {getAllItemsForBOM} = require("../../../purchase/items/items");
const {getAllCheckedItemCategoriesList} = require("../../../purchase/itemCategoryMaster/itemCategoryMaster");
const {getAllInkListForBOM} = require("../../../production/inkMaster/inkMaster");
const {getAllProductMaster} = require("../../productMaster/productMaster");
const {
    getAllBOMOfProductAttributes
} = require("../../../../../models/planning/helpers/billOfMaterialHelper/BoMOfProductHelper");
const {BOM_OF_PRODUCT} = require("../../../../../mocks/schemasConstant/planningConstant");
const {getAndSetAutoIncrementNo} = require("../../../settings/autoIncrement/autoIncrement");
const {
    getAllBoMOfProductAggregate
} = require("../../../../../models/planning/repository/BOMRepository/BoMOfProductRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.create = asyncHandler(async (req, res) => {
    try {
        let existingUser = await Model.findOne(
            {
                product: req.body.product
            },
            {_id: 1}
        );
        if (existingUser) {
            let errors = "BOM already exists with this same Product";
            return res.preconditionFailed(errors);
        }
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const saveObj = new Model(createdObj);
        const itemDetails = await saveObj.save();
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("BoM Of Product")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create BoM Of Product", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllBOMOfProductAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company)
                }
            }
        ];
        let rows = await getAllBoMOfProductAggregate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("BoM Of Product");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById  BoM Of Product", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("BoM Of Product")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("BoM Of Product");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById BoM Of Product", e);
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
        if (req.body.BoMOfProductDetails) {
            itemDetails.BoMOfProductDetails = req.body.BoMOfProductDetails;
        }
        itemDetails = await itemDetails.save();

        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("BoM Of Product has been")
        });
    } catch (e) {
        console.error("update BoM Of Product", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let productMasterOptions = await getAllProductMaster(req.user.company, {
            productNo: 1,
            productName: 1,
            productDescription: 1,
            primaryUnit: 1,
            productCategory: 1
        });
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...BOM_OF_PRODUCT.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        return res.success({
            productMasterOptions,
            autoIncrementNo
        });
    } catch (error) {
        console.error("getAllMasterData BoM Of Product", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getBOMOfProductCount = asyncHandler(async company => {
    try {
        const result = await Model.aggregate([
            {
                $match: {
                    company: ObjectId(company)
                }
            },
            {
                $group: {
                    _id: null,
                    counts: {$sum: 1}
                }
            },
            {
                $project: {
                    _id: 0,
                    counts: 1
                }
            }
        ]);
        if (result.length > 0) {
            return result[0]?.counts;
        }
    } catch (error) {
        console.error("Not able to get record ", error);
    }
});

exports.getAllMergedItemForBOMOfProduct = asyncHandler(async (req, res) => {
    try {
        if (req.query.action == "create") {
            let exists = await Model.findOne(
                {
                    product: req.query.product
                },
                {_id: 1}
            );
            if (exists) {
                let errors = "BOM already exists with this same Product";
                return res.preconditionFailed(errors);
            }
        }
        let childItems = await ProdItemMaster.getAllProdItemsListForBOM(req.user.company, null, "SKU");
        let itemCategoriesList = await getAllCheckedItemCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            BOM: true
        });
        const inkList = await getAllInkListForBOM(req.user.company);
        itemCategoriesList = itemCategoriesList.map(x => x.category);
        let itemsList = await getAllItemsForBOM(req.user.company, itemCategoriesList);
        let mergedItems = [...itemsList, ...childItems, ...inkList];
        return res.success({mergedItems});
    } catch (error) {
        console.error("getAllMergedItemForBOMOfProduct", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
