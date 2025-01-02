const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/planning/SKUCostSheetModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {getAllSKUCategory} = require("../../settings/SKUCategoryMaster/SKUCategoryMaster");
const {default: mongoose} = require("mongoose");
const {SKU_COST_SHEET_DETAILS} = require("../../../../mocks/constantData");
const {getMaterialCostBySKUId} = require("../billOfMaterial/BoMOfSKU/BoMOfSKUs");
const {getTotalCostBySKUId} = require("../directCost/directCost");
const {getOPEX} = require("../../finance/operatingExpenses/operatingExpenses");
const {getAllSKUByCategory, getAllSKUs} = require("../../sales/SKU/SKU");
const {
    getAllSKUCostSheetAttributes,
    getAllSKUCostSheetReportsAttributes
} = require("../../../../models/planning/helpers/SKUCostSheetHelper");
const {getQMSMappingByModuleAndTitle} = require("../../settings/report-qms-mapping/report-qms-mapping");
const {CONSTANTS} = require("../../../../../config/config");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {SKU_COST_SHEET} = require("../../../../mocks/schemasConstant/planningConstant");
const SKUCostSheetRepository = require("../../../../models/planning/repository/SKUCostSheetRepository");
const {filteredProductCategoryMasterList} = require("../../../../models/settings/repository/productCategoryRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllSKUCostSheetAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company)
                }
            },
            {
                $addFields: {
                    SKUCostDetails: {
                        $arrayToObject: {
                            $map: {
                                input: "$SKUCostDetails",
                                as: "details",
                                in: {
                                    k: "$$details.costHead",
                                    v: "$$details.costPerUnit"
                                }
                            }
                        }
                    }
                }
            }
        ];
        let rows = await SKUCostSheetRepository.getAllPaginate({pipeline, project, queryParams: req.query});
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
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("SKU Cost Sheet")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create SKU Cost Sheet", e);
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
        if (req.body.SKUCostDetails) {
            itemDetails.SKUCostDetails = req.body.SKUCostDetails;
        }
        itemDetails = await itemDetails.save();
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("SKU Cost Sheet has been")
        });
    } catch (e) {
        console.error("update SKU Cost Sheet", e);
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
                message: MESSAGES.apiSuccessStrings.DELETED("SKU Cost Sheet")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("SKU Cost Sheet");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById SKU Cost Sheet", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("SKU Cost Sheet");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById SKU Cost Sheet", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getByIdForPdf = asyncHandler(async (req, res) => {
    try {
        const taxPercentage = await findAppParameterValue("PAT_SKU_COST_SHEET", req.user.company);
        let existing = await Model.aggregate([
            {
                $match: {
                    _id: ObjectId(req.params.id)
                }
            },
            {
                $lookup: {
                    from: "Company",
                    localField: "company",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                _id: 0,
                                companyName: 1,
                                logoUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$logo"]}
                            }
                        }
                    ],
                    as: "company"
                }
            },
            {$unwind: "$company"},
            {
                $lookup: {
                    from: "SKUMaster",
                    localField: "SKU",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                _id: 0,
                                customerInfo: {$arrayElemAt: ["$customerInfo", 0]}
                            }
                        }
                    ],
                    as: "SKU"
                }
            },
            {
                $unwind: {
                    path: "$SKU",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    customerName: "$SKU.customerInfo.customerName",
                    logoUrl: "$company.logoUrl"
                }
            },
            {
                $project: {
                    createdBy: 0,
                    updatedBy: 0,
                    updatedAt: 0,
                    company: 0,
                    SKU: 0,
                    __v: 0
                }
            }
        ]);

        if (!existing.length) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("SKU Cost Sheet");
            return res.unprocessableEntity(errors);
        } else {
            for (const ele of existing[0].SKUCostDetails) {
                if (ele.costHead == "Profit") {
                    existing[0].profitBeforeTaxPercent = ele.percentage + " " + "%";
                    existing[0].profitAfterTaxPercent =
                        (ele.percentage - (ele.percentage * +taxPercentage) / 100).toFixed(2) + " " + "%";
                }
            }
        }
        return res.success(existing.length > 0 ? existing[0] : []);
    } catch (e) {
        console.error("getByIdForPdf SKU Cost Sheet", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getSKUCostSheetDetailsBySKUId = asyncHandler(async (req, res) => {
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
        }
        let totalMaterialCost = await getMaterialCostBySKUId(req.user.company, req.params.id);
        let totalDirectCosts = await getTotalCostBySKUId(req.user.company, req.params.id);
        let operatingExpenses = await getOPEX(req.user.company);
        let COGS = +(
            totalMaterialCost +
            totalDirectCosts?.totalLabourCostPerUnit +
            totalDirectCosts?.totalDirectExpenses
        ).toFixed(2);
        let sellingPrice = +(COGS + operatingExpenses).toFixed(2);
        let getPercentage = value => {
            if (sellingPrice == 0) 0;
            return +((value * 100) / sellingPrice).toFixed(2);
        };
        let SKUCostSheetDetails = SKU_COST_SHEET_DETAILS.map(x => {
            if (x.costHead == "Direct Material") {
                x.costPerUnit = totalMaterialCost;
                x.percentage = getPercentage(x.costPerUnit);
            }

            if (x.costHead == "Direct Labour") {
                x.costPerUnit = totalDirectCosts?.totalLabourCostPerUnit;
                x.percentage = getPercentage(x.costPerUnit);
            }

            if (x.costHead == "Direct Expenses") {
                x.costPerUnit = totalDirectCosts?.totalDirectExpenses;
                x.percentage = getPercentage(x.costPerUnit);
            }

            if (x.costHead == "Cost of Goods Sold(COGS)") {
                x.costPerUnit = COGS;
                x.percentage = getPercentage(x.costPerUnit);
            }

            if (x.costHead == "Operating Expenses (OPEX)") {
                x.costPerUnit = operatingExpenses;
                x.percentage = getPercentage(x.costPerUnit);
            }

            if (x.costHead == "Total Cost of Operation (COGS + OPEX)") {
                x.costPerUnit = +(COGS + operatingExpenses).toFixed(2);
                x.percentage = getPercentage(x.costPerUnit);
            }

            if (x.costHead == "Profit") {
                x.costPerUnit = 0;
                x.percentage = getPercentage(x.costPerUnit);
            }

            if (x.costHead == "Selling Price") {
                x.costPerUnit = +(COGS + operatingExpenses).toFixed(2);
                x.percentage = getPercentage(x.costPerUnit);
            }
            return x;
        });

        return res.success(SKUCostSheetDetails);
    } catch (e) {
        console.error("getSKUCostSheetDetailsBySKUId", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
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
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...SKU_COST_SHEET.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        return res.success({autoIncrementNo, productCategories});
    } catch (error) {
        console.error("getAllMasterData SKU Cost Sheet", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllSKUCostSheet = async (company, project) => {
    try {
        let SKUCostSheetList = await Model.find({company: company}, project);
        return SKUCostSheetList;
    } catch (e) {
        console.error("SKUCostSheetList", e);
    }
};

exports.getSKUInCostSheet = asyncHandler(async (req, res) => {
    try {
        let SKUObj = await getAllSKUByCategory(req.query.category, req.user.company, {
            SKUNo: 1,
            productCategory: 1,
            SKUName: 1,
            SKUDescription: 1,
            primaryUnit: 1
        });
        return res.success(SKUObj);
    } catch (e) {
        console.error("getSKUInCostSheet", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
 
