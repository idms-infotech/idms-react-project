const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/production/inkMasterModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {getAllItemsForFormulationInk} = require("../../purchase/items/items");
const {default: mongoose} = require("mongoose");
const {getAllCheckedItemCategoriesList} = require("../../purchase/itemCategoryMaster/itemCategoryMaster");
const {getAllInkMasterAttributes} = require("../../../../models/production/helpers/inkMasterHelper");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {INK_MASTER} = require("../../../../mocks/schemasConstant/productionConstant");
const {filteredHSNList} = require("../../../../models/purchase/repository/hsnRepository");
const InkMasterRepository = require("../../../../models/production/repository/inkMasterRepository");
const CompanyRepository = require("../../../../models/settings/repository/companyRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {filteredSubModuleManagementList} = require("../../../../models/settings/repository/subModuleRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let project = getAllInkMasterAttributes();
        let rows = await InkMasterRepository.getAllPaginate({pipeline, project, queryParams: req.query});
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
        const saveObj = new Model(createdObj);
        const itemDetails = await saveObj.save();
        if (itemDetails) {
            res.success({
                message: "Ink Master has been created successfully"
            });
        }
    } catch (e) {
        console.error("create Ink Master", e);
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

        if (req.body.inkMasterDetails) {
            itemDetails.inkMasterDetails = req.body.inkMasterDetails;
        }
        itemDetails = await itemDetails.save();
        if (itemDetails) {
            res.success({
                message: "Ink Master has been updated successfully"
            });
        }
    } catch (e) {
        console.error("update Ink Master", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("Ink Master")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Ink Master");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Ink Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Ink Master");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Ink Master", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let addLabValues = await findAppParameterValue("ADD_LAB_VALUES", req.user.company);
        const featureConfig = await filteredSubModuleManagementList([
            {
                $match: {
                    _id: ObjectId(req.query.subModuleId)
                }
            },
            {
                $unwind: "$featureConfig"
            },
            {
                $match: {
                    "featureConfig.status": true
                }
            },
            {
                $project: {
                    featureCode: "$featureConfig.featureCode",
                    value: "$featureConfig.value"
                }
            }
        ]);

        let company = await CompanyRepository.getDocById(req.user.company, {companyType: 1});

        addLabValues = addLabValues?.toLowerCase();
        const autoIncrementNo = await getAndSetAutoIncrementNo({...INK_MASTER.AUTO_INCREMENT_DATA()}, req.user.company);
        const UOMOptions = await getAllModuleMaster(req.user.company, "INK_MASTER_UOM");

        const HSNCodesList = await filteredHSNList([
            {$match: {company: ObjectId(req.user.company), isActive: "Y"}},
            {$sort: {createdAt: -1}},
            {
                $project: {
                    label: {$concat: ["$hsnCode", "$goodsDescription"]},
                    value: "$hsnCode",
                    hsnCode: 1,
                    goodsDescription: 1,
                    gstRate: 1,
                    igstRate: 1,
                    cgstRate: 1,
                    sgstRate: 1
                }
            }
        ]);

        let mergedItemInkList = await getAllMergeItemInk(req.user.company);
        let WXLDimensionsUnit = await getAllModuleMaster(req.user.company, "WXL_DIMENSIONS_UNIT");
        return res.success({
            HSNCodesList,
            autoIncrementNo,
            mergedItemInkList,
            UOMOptions,
            addLabValues,
            companyType: company.companyType,
            WXLDimensionsUnit: WXLDimensionsUnit?.map(x => x.value),
            featureConfig
        });
    } catch (error) {
        console.error("getAllMasterData Items", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllInkList = async company => {
    try {
        let rows = Model.aggregate([
            {
                $match: {
                    company: ObjectId(company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $addFields: {
                    colSeq: null,
                    mesh: 0,
                    GSM: 0,
                    areaSqm: 0,
                    inkArea: 0,
                    inkAreaSqm: 0,
                    ink: 0
                }
            },
            {
                $project: {
                    inkId: "$_id",
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    UoM: 1,
                    colSeq: 1,
                    mesh: 1,
                    GSM: 1,
                    areaSqm: 1,
                    inkArea: 1,
                    inkAreaSqm: 1,
                    inkCostPerKg: 1,
                    inkCostPerGm: 1,
                    ink: 1
                }
            },
            {$sort: {itemCode: 1}}
        ]);
        return rows;
    } catch (e) {
        console.error("error", e);
    }
};
exports.getAllInkListForBOM = async company => {
    try {
        let rows = Model.aggregate([
            {
                $match: {
                    company: ObjectId(company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $addFields: {
                    partCount: 0,
                    itemCost: 0
                }
            },
            {
                $project: {
                    reference: "$_id",
                    referenceModel: "InkMaster",
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    UOM: "g",
                    unitCost: {$ifNull: ["$inkCostPerGm", 0]},
                    type: "ink",
                    partCount: {$ifNull: ["$partCount", 0]},
                    itemCost: {$ifNull: ["$itemCost", 0]},
                    qtyPerSKUUnit: {$literal: 0},
                    wastePercentage: {$literal: 0},
                    _id: 0
                }
            },
            {$sort: {itemCode: 1}}
        ]);
        return rows;
    } catch (e) {
        console.error("error", e);
    }
};

// Formulation + Item Data merged
const getAllMergeItemInk = async company => {
    try {
        let itemCategoriesList = await getAllCheckedItemCategoriesList({
            categoryStatus: OPTIONS.defaultStatus.ACTIVE,
            inkMaster: true
        });
        itemCategoriesList = itemCategoriesList.map(x => x.category);
        let itemsList = await getAllItemsForFormulationInk(company, itemCategoriesList);
        let rows = await Model.aggregate([
            {
                $match: {
                    company: ObjectId(company),
                    status: OPTIONS.defaultStatus.ACTIVE
                }
            },
            {
                $project: {
                    seq: null,
                    item: "$_id",
                    referenceModel: "InkMaster",
                    itemCode: 1,
                    itemName: 1,
                    itemDescription: 1,
                    UoM: "g",
                    ratePerUnit: "$inkCostPerGm",
                    qtyPerKgInitial: {$literal: 0},
                    percentageLoading: {$literal: 0},
                    qtyPerKgFinal: {$literal: 0},
                    itemCost: {$literal: 0}
                }
            },
            {$sort: {itemCode: 1}}
        ]);
        const mergedData = [...itemsList, ...rows];
        return mergedData;
    } catch (e) {
        console.error("error", e);
    }
};
