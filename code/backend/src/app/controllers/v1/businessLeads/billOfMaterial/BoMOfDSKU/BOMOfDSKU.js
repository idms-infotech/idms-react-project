const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../../helpers/messages.options");
const {OPTIONS} = require("../../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const ProdItemMaster = require("../../../planning/prodItemMaster/prodItemMaster");
const {getAllItemsForBOM} = require("../../../purchase/items/items");
const {getAllCheckedItemCategoriesList} = require("../../../purchase/itemCategoryMaster/itemCategoryMaster");
const {createBOMOfSKU} = require("../../../planning/billOfMaterial/BoMOfSKU/BoMOfSKUs");
const NPDMaster = require("../../NPDMaster/NPDMasters");
const {getAllInkListForBOM} = require("../../../production/inkMaster/inkMaster");
const {getAllBOMOfSKUAttributes} = require("../../../../../models/businessLeads/helpers/BOMOfDSKUHelper");
const {getAndSetAutoIncrementNo} = require("../../../settings/autoIncrement/autoIncrement");
const {BOM_DSKU} = require("../../../../../mocks/schemasConstant/businessLeadsConstant");
const BOMOfDSKURepository = require("../../../../../models/businessLeads/repository/BOMOfDSKURepository");
const ObjectId = mongoose.Types.ObjectId;

exports.create = asyncHandler(async (req, res) => {
    try {
        let existingUser = await BOMOfDSKURepository.findOneDoc({
            SKU: req.body.SKU
        });
        if (existingUser) {
            let errors = "BOM already exists with this same D SKU";
            return res.preconditionFailed(errors);
        }
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const itemDetails = await BOMOfDSKURepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("BoM Of D SKU")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create BoM Of DSKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllBOMOfSKUAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    isConvertedToBOMOfSKU: false
                }
            }
        ];
        let rows = await BOMOfDSKURepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await BOMOfDSKURepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("BoM Of DSKU");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById  BoM Of DSKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await BOMOfDSKURepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("BoM Of DSKU")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("BoM Of DSKU");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById BoM Of DSKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await BOMOfDSKURepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        await BOMOfDSKURepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("BoM Of DSKU has been")
        });
    } catch (e) {
        console.error("update BoM Of DSKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let DSKUListOptions = await NPDMaster.getAllNPDMaster(
            {isConvertedToSKU: false},
            {dSKUNo: 1, SKUNo: 1, SKUName: 1, SKUDescription: 1, primaryUnit: 1}
        );
        let childItems = await ProdItemMaster.getAllProdItemsListForBOM(req.user.company, null, "SKU");
        let itemCategoriesList = await getAllCheckedItemCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            BOM: true
        });
        const inkList = await getAllInkListForBOM(req.user.company);
        itemCategoriesList = itemCategoriesList.map(x => x.category);
        let itemsList = await getAllItemsForBOM(req.user.company, itemCategoriesList);
        let mergedItems = [...itemsList, ...childItems, ...inkList];
        const autoIncrementNo = await getAndSetAutoIncrementNo({...BOM_DSKU.AUTO_INCREMENT_DATA()}, req.user.company);
        return res.success({
            DSKUListOptions,
            mergedItems,
            autoIncrementNo
        });
    } catch (error) {
        console.error("getAllMasterData BoM Of DSKU", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getBOMOfSKUCount = asyncHandler(async company => {
    try {
        const result = await BOMOfDSKURepository.filteredBOMOfDSKUList([
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE,
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

exports.getAllInkListBySKUId = asyncHandler(async (req, res) => {
    try {
        if (req.query.action == "create") {
            let exists = await BOMOfDSKURepository.findOneDoc({
                SKU: req.query.SKUId
            });
            if (exists) {
                let errors = "BOM already exists with this same D SKU";
                return res.preconditionFailed(errors);
            }
        }
        const inkList = await NPDMaster.getAllDSKUInkDetailsForBOMByDSKUId(req.user.company, req.query.SKUId);
        return res.success(inkList);
    } catch (e) {
        console.error("getAllInkListBySKUId", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.updateBOMOfDSKUStatus = async (NPDId, newSKUObj) => {
    try {
        let createObj = await BOMOfDSKURepository.findOneDoc({
            SKU: NPDId
        });
        createObj.SKU = newSKUObj._id.valueOf();
        createObj.SKUCode = newSKUObj.SKUNo;
        createObj.SKUName = newSKUObj.SKUName;
        createObj.SKUDescription = newSKUObj.SKUDescription;
        createObj = await createBOMOfSKU(createObj);
        if (createObj) {
            await BOMOfDSKURepository.findAndUpdateDoc(
                {
                    SKU: NPDId
                },
                {isConvertedToBOMOfSKU: true}
            );
        }
    } catch (e) {
        console.error("updateBOMOfDSKUStatus", e);
    }
};

exports.getMaterialCostByDSKUId = async (company, SKUId) => {
    try {
        const SKUObj = await BOMOfDSKURepository.findOneDoc({company: company, SKU: SKUId}, {totalMaterialCost: 1});
        return SKUObj?.totalMaterialCost || 0;
    } catch (e) {
        console.error("getBOMBySKUId", e);
    }
};
