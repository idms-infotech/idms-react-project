const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/planning/directCostModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {getAllDirectCostAttributes} = require("../../../../models/planning/helpers/directCostHelper");
const {getAllProcessMasterForDirectCost} = require("../processMaster/processMaster");
const {getAllSKUCategory} = require("../../settings/SKUCategoryMaster/SKUCategoryMaster");
const {getAllSKUByCategory} = require("../../sales/SKU/SKU");
const {default: mongoose} = require("mongoose");
const {DIRECT_COST} = require("../../../../mocks/schemasConstant/planningConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {getAllDirectCostAggregate} = require("../../../../models/planning/repository/directCostRepository");
const {filteredProductCategoryMasterList} = require("../../../../models/settings/repository/productCategoryRepository");
const {
    filteredProcessSpecByProdCategoryList
} = require("../../../../models/finance/repository/processSpecByProdCategoryRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllDirectCostAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company)
                }
            }
        ];
        let rows = await getAllDirectCostAggregate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.create = asyncHandler(async (req, res) => {
    try {
        let exists = await Model.findOne(
            {
                SKU: req.body.SKU
            },
            {_id: 1}
        );
        if (exists) {
            let errors = MESSAGES.apiErrorStrings.Data_EXISTS("SKU");
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
                message: MESSAGES.apiSuccessStrings.ADDED("Direct Cost")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Direct Cost", e);
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
        if (req.body.directCostDetails) {
            itemDetails.directCostDetails = req.body.directCostDetails;
        }
        if (req.body.toolingCostDetails) {
            itemDetails.toolingCostDetails = req.body.toolingCostDetails;
        }
        itemDetails = await itemDetails.save();
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Direct Cost has been")
        });
    } catch (e) {
        console.error("update Direct Cost", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("Direct Cost")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Direct Cost");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Direct Cost", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Direct Cost");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Direct Cost", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...DIRECT_COST.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        const processList = await getAllProcessMasterForDirectCost(req.user.company);
        const SKUCategoryList = await getAllSKUCategory(req.user.company, null);
        let productCategories = [];
        if (SKUCategoryList.length > 0) {
            productCategories = SKUCategoryList.map(x => {
                return {
                    label: x.displayProductCategoryName,
                    value: x.displayProductCategoryName,
                    application: x.application,
                    productNumber: x.SKUCategoryName,
                    productCode: x.productCode
                };
            });
        } else {
            productCategories = await filteredProductCategoryMasterList([
                {
                    $match: {
                        company: ObjectId(req.user.company),
                        categoryStatus: OPTIONS.defaultStatus.ACTIVE
                    }
                },
                {$sort: {seq: 1}},
                {
                    $project: {
                        productNumber: 1,
                        productCode: 1,
                        displayProductCategoryName: 1,
                        application: 1
                    }
                }
            ]);
            productCategories = productCategories.map(x => {
                return {
                    label: x.displayProductCategoryName,
                    value: x.displayProductCategoryName,
                    application: x.application,
                    productNumber: x.productNumber,
                    productCode: x.productCode
                };
            });
        }
        return res.success({autoIncrementNo, processList, productCategories});
    } catch (error) {
        console.error("getAllMasterData Direct Cost", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getSKUData = asyncHandler(async (req, res) => {
    try {
        const processList = await filteredProcessSpecByProdCategoryList([
            {
                $match: {
                    displayProductCategoryName: req.query.category,
                    company: ObjectId(req.user.company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {$unwind: "$processInfo"},
            {
                $project: {
                    process: "$processInfo.process",
                    processId: "$processInfo.processId",
                    processName: "$processInfo.processName",
                    unitProcessOutput: "$processInfo.unitProcessOutput",
                    labourRatePerHr: "$processInfo.labourRatePerHr",
                    assetRatePerHr: "$processInfo.totalAllocatedAssetCostPerHr",
                    PFSeq: {$literal: null},
                    specQuantity: {$literal: 0},
                    processHrs: {$literal: 0},
                    labourCost: {$literal: 0},
                    CAUnitsOfLabour: {$literal: 0},
                    labourCostPerUnit: {$literal: 0},
                    assetCost: {$literal: 0},
                    CAUnitsOfAssets: {$literal: 0},
                    assetCostPerUnit: {$literal: 0}
                }
            }
        ]);
        let SKUObj = await getAllSKUByCategory(req.query.category, req.user.company, {
            SKUNo: 1,
            productCategory: 1,
            SKUName: 1,
            SKUDescription: 1,
            primaryUnit: 1,
            processCAQty: {$cond: [{$not: ["$offTakeInfo.processCAQty"]}, 0, "$offTakeInfo.processCAQty"]},
            toolingCAQty: {$cond: [{$not: ["$offTakeInfo.toolingCAQty"]}, 0, "$offTakeInfo.toolingCAQty"]}
        });
        return res.success({SKUObj, processList});
    } catch (e) {
        console.error("getSKUData", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.checkSKUExistsBySKUId = asyncHandler(async (req, res) => {
    try {
        let exists = await Model.findOne(
            {
                SKU: req.params.id
            },
            {_id: 1}
        );
        if (exists) {
            let errors = MESSAGES.apiErrorStrings.Data_EXISTS("SKU");
            return res.preconditionFailed(errors);
        } else {
            return res.success({});
        }
    } catch (e) {
        console.error("checkSKUExistsBySKUId", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getTotalCostBySKUId = async (company, SKU) => {
    try {
        let SKUObj = await Model.findOne(
            {company, SKU},
            {
                totalDirectExpenses: {
                    $round: [{$sum: ["$totalAssetCostPerUnit", "$totalToolingCostPerUnit"]}, 2]
                },
                totalLabourCostPerUnit: 1,
                _id: 0
            }
        ).lean();
        return SKUObj ?? {totalLabourCostPerUnit: 0, totalDirectExpenses: 0};
    } catch (e) {
        console.error("getTotalCostBySKUId", e);
    }
};
