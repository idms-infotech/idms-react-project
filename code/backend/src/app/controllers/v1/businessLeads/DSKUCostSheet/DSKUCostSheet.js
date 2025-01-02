const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {OPTIONS} = require("../../../../helpers/global.options");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {default: mongoose} = require("mongoose");
const {SKU_COST_SHEET_DETAILS} = require("../../../../mocks/constantData");
const {getOPEX} = require("../../finance/operatingExpenses/operatingExpenses");
const {
    getAllDSKUCostSheetAttributes,
    getAllDSKUCostSheetReportsAttributes
} = require("../../../../models/businessLeads/helpers/DSKUCostSheetHelper");
const {getQMSMappingByModuleAndTitle} = require("../../settings/report-qms-mapping/report-qms-mapping");
const {CONSTANTS} = require("../../../../../config/config");
const {getMaterialCostByDSKUId} = require("../billOfMaterial/BoMOfDSKU/BOMOfDSKU");
const {getTotalCostByDSKUId} = require("../directCostDSKU/directCostDSKU");
const {getAllMapCategoryHSN} = require("../../sales/mapCategoryHSNMaster/mapCategoryHSN");
const {getAllDSKUByCategory, getAllNPDMaster} = require("../NPDMaster/NPDMasters");
const {DSKU_COST_SHEET} = require("../../../../mocks/schemasConstant/businessLeadsConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const DSKUCostSheetRepo = require("../../../../models/businessLeads/repository/DSKUCostSheetRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllDSKUCostSheetAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company)}},
            {
                $addFields: {
                    DSKUCostDetails: {
                        $arrayToObject: {
                            $map: {
                                input: "$DSKUCostDetails",
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
        let rows = await DSKUCostSheetRepo.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.create = asyncHandler(async (req, res) => {
    try {
        let exists = await DSKUCostSheetRepo.findOneDoc(
            {
                DSKU: req.body.DSKU
            },
            {_id: 1}
        );
        if (exists) {
            let errors = MESSAGES.apiErrorStrings.Data_EXISTS("DSKU");
            return res.preconditionFailed(errors);
        }
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const itemDetails = await DSKUCostSheetRepo.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("DSKU Cost Sheet")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create DSKU Cost Sheet", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await DSKUCostSheetRepo.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await DSKUCostSheetRepo.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("DSKU Cost Sheet has been")
        });
    } catch (e) {
        console.error("update DSKU Cost Sheet", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await DSKUCostSheetRepo.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("DSKU Cost Sheet")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("DSKU Cost Sheet");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById DSKU Cost Sheet", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await DSKUCostSheetRepo.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("DSKU Cost Sheet");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById DSKU Cost Sheet", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getByIdForPdf = asyncHandler(async (req, res) => {
    try {
        const taxPercentage = await findAppParameterValue("PAT_SKU_COST_SHEET", req.user.company);
        let existing = await DSKUCostSheetRepo.filteredDSKUCostSheetList([
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
                    from: "NPDMaster",
                    localField: "DSKU",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                _id: 0,
                                customerInfo: {$arrayElemAt: ["$customerInfo", 0]}
                            }
                        }
                    ],
                    as: "DSKU"
                }
            },
            {
                $unwind: {
                    path: "$DSKU",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    customerName: "$DSKU.customerInfo.customerName",
                    logoUrl: "$company.logoUrl"
                }
            },
            {
                $project: {
                    createdBy: 0,
                    updatedBy: 0,
                    updatedAt: 0,
                    company: 0,
                    DSKU: 0,
                    __v: 0
                }
            }
        ]);

        if (!existing.length) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("DSKU Cost Sheet");
            return res.unprocessableEntity(errors);
        } else {
            for (const ele of existing[0].DSKUCostDetails) {
                if (ele.costHead == "Profit") {
                    existing[0].profitBeforeTaxPercent = ele.percentage + " " + "%";
                    existing[0].profitAfterTaxPercent =
                        (ele.percentage - (ele.percentage * +taxPercentage) / 100).toFixed(2) + " " + "%";
                }
            }
        }
        return res.success(existing.length > 0 ? existing[0] : []);
    } catch (e) {
        console.error("getByIdForPdf DSKU Cost Sheet", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getDSKUCostSheetDetailsByDSKUId = asyncHandler(async (req, res) => {
    try {
        let exists = await DSKUCostSheetRepo.findOneDoc(
            {
                DSKU: req.params.id
            },
            {_id: 1}
        );
        if (exists) {
            let errors = MESSAGES.apiErrorStrings.Data_EXISTS("DSKU");
            return res.preconditionFailed(errors);
        }
        let totalMaterialCost = await getMaterialCostByDSKUId(req.user.company, req.params.id);
        let totalDirectCosts = await getTotalCostByDSKUId(req.user.company, req.params.id);
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
        let DSKUCostSheetDetails = SKU_COST_SHEET_DETAILS.map(x => {
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

        return res.success(DSKUCostSheetDetails);
    } catch (e) {
        console.error("getDSKUCostSheetDetailsByDSKUId", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const categoryOptions = await getAllMapCategoryHSN(
            {status: OPTIONS.defaultStatus.ACTIVE, company: req.user.company},
            {productCategory: 1}
        );
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...DSKU_COST_SHEET.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        return res.success({autoIncrementNo, categoryOptions});
    } catch (error) {
        console.error("getAllMasterData DSKU Cost Sheet", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getDSKUInCostSheet = asyncHandler(async (req, res) => {
    try {
        let SKUObj = await getAllDSKUByCategory(req.query.category, req.user.company, {
            dSKUNo: 1,
            productCategory: 1,
            SKUName: 1,
            SKUDescription: 1,
            primaryUnit: 1,
            processCAQty: {$cond: [{$not: ["$offTakeInfo.processCAQty"]}, 0, "$offTakeInfo.processCAQty"]},
            toolingCAQty: {$cond: [{$not: ["$offTakeInfo.toolingCAQty"]}, 0, "$offTakeInfo.toolingCAQty"]}
        });
        return res.success(SKUObj);
    } catch (e) {
        console.error("getDSKUInCostSheet", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        const DSKUList = await getAllNPDMaster({company: ObjectId(req.user.company)}, {SKUName: 1});
        const categoryList = await getAllMapCategoryHSN(
            {status: OPTIONS.defaultStatus.ACTIVE, company: req.user.company},
            {productCategory: 1}
        );
        const {toDate = null, fromDate = null, DSKUId = null, DSKUCategory = null} = req.query;
        let query = {
            company: ObjectId(req.user.company),
            ...(!!DSKUId && {DSKU: ObjectId(DSKUId)}),
            ...(!!DSKUCategory && {productCategory: DSKUCategory}),
            ...(!!toDate &&
                !!fromDate && {
                    createdAt: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let project = getAllDSKUCostSheetReportsAttributes();
        let pipeline = [
            {
                $match: query
            },
            {
                $addFields: {
                    DSKUCostDetails: {
                        $arrayToObject: {
                            $map: {
                                input: "$DSKUCostDetails",
                                as: "details",
                                in: {
                                    k: "$$details.costHead",
                                    v: {costPerUnit: "$$details.costPerUnit", percentage: "$$details.percentage"}
                                }
                            }
                        }
                    }
                }
            }
        ];
        let rows = await DSKUCostSheetRepo.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        const display = await getQMSMappingByModuleAndTitle(req.user.company, "Planning", "Cost Sheet");
        return res.success({
            ...rows,
            DSKUList,
            display,
            categoryList
        });
    } catch (e) {
        console.error("getAllReports", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
