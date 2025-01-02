const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/finance/operatingExpensesModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {outputData, getAllAggregationFooter} = require("../../../../helpers/utility");
const {getMatchData} = require("../../../../helpers/global.options");
const {getAllOperatingExpensesAttributes} = require("../../../../models/finance/helpers/operatingExpensesHelper");
const {getAllCostHead} = require("../../settings/costHead/costHead");
const {COST_HEADS} = require("../../../../mocks/constantData");
const {default: mongoose} = require("mongoose");
const {getLastDateOfCurrentFiscalYear} = require("../../../../utilities/utility");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        const {
            search = null,
            excel = "false",
            page = 1,
            pageSize = 10,
            column = "createdAt",
            direction = -1
        } = req.query;
        let skip = Math.max(0, page - 1) * pageSize;
        let project = getAllOperatingExpensesAttributes();
        let match = await getMatchData(project, search);
        let pagination = [];
        if (excel == "false") {
            pagination = [{$skip: +skip}, {$limit: +pageSize}];
        }
        let rows = await Model.aggregate([
            {$match: {company: ObjectId(req.user.company)}},
            ...getAllAggregationFooter(project, match, column, direction, pagination)
        ]);
        return res.success({
            ...outputData(rows)
        });
    } catch (e) {
        console.error("getAllOperatingExpenses", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        req.body = [...req.body.costHeadList, ...req.body.opexAllocation];
        let toUpdateArray = [];
        for (let body of req.body) {
            let keys = Object.keys(body).filter(x => x.includes("id"));
            let CH = {
                Rent: "rent",
                "Indirect Salaries & benefits": "indirectSalaries",
                Insurance: "insurance",
                "Maintenance & Repairs": "maintenance",
                "Consumables & Spares": "consumables",
                Electricity: "electricity",
                Utility: "utility",
                Marketing: "marketing",
                "Sales & Distribution": "salesAndDistribution",
                "Admin & Other": "adminAndOthers",
                "TOTAL OPEX": "totalOperatingCost",
                "Total No. of Units Produced": "totalUnitsProduced",
                "Allocation % (SBU/Product)": "percentageAllocation",
                "Opex Cost (Ccy)/Unit": "opexCostPerUnit"
            };

            for (let key of keys) {
                let yr = key.split("_")[1];
                let _id = body[key];
                let costHead = body.costHead;
                let particulars = body.particulars;
                let value = body[`fy_${yr}`];
                let index = toUpdateArray.map(m => m._id).indexOf(_id);
                let costHeadsKey;
                let particularsKey;
                if (index !== -1) {
                    costHeadsKey = CH[costHead];
                    particularsKey = CH[particulars];
                    if (costHeadsKey && costHeadsKey != "totalOperatingCost") {
                        toUpdateArray[index].operatingCostDetails[costHeadsKey] = value;
                    } else {
                        if (costHeadsKey) {
                            toUpdateArray[index][costHeadsKey] = value;
                        }
                    }
                    if (particularsKey) {
                        toUpdateArray[index][particularsKey] = value;
                    }
                } else {
                    costHeadsKey = CH[costHead];
                    let obj = {
                        _id: _id,
                        company: req.user.company,
                        createdBy: req.user.sub,
                        updatedBy: req.user.sub,
                        operatingCostDetails: {},
                        totalOperatingCost: 0
                    };
                    if (costHeadsKey && costHeadsKey != "totalOperatingCost") {
                        obj.operatingCostDetails[costHeadsKey] = value;
                    } else {
                        obj[costHeadsKey] = value;
                    }
                    toUpdateArray.push(obj);
                }
            }
        }
        for (const doc of toUpdateArray) {
            await Model.update({_id: doc._id}, {$set: doc}, {upsert: true});
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("OperatingExpenses")
        });
    } catch (e) {
        console.error("update OperatingExpenses", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let costHeadList = await getAllCostHead(req.user.company, {
            order: 1,
            costHead: 1,
            displayName: 1,
            category: 1,
            _id: 0
        });
        const operatingExpensesList = await Model.find({});
        let currency = "";
        let opexAllocation;
        let lastRow = {
            displayName: "TOTAL OPEX",
            costHead: "TOTAL OPEX",
            category: "Fixed + Variable"
        };

        costHeadList = costHeadList.map(x => {
            currency = x.company.accountsDetails.reportingCurrency;
            let obj = {
                displayName: x.displayName,
                costHead: x.costHead,
                category: x.category,
                reportingCurrency: currency
            };
            opexAllocation = [
                {
                    particulars: `Total OPEX (Ccy)`
                },
                {
                    particulars: "Allocation % (SBU/Product)"
                },
                {
                    particulars: "Total No. of Units Produced"
                },
                {
                    particulars: `Opex Cost (Ccy)/Unit`
                }
            ];
            for (const ele of operatingExpensesList) {
                if (x.costHead == COST_HEADS.RENT) {
                    obj[`fy_${ele.year}`] = ele.operatingCostDetails.rent;
                    obj[`id_${ele.year}`] = ele._id;
                }
                if (x.costHead == COST_HEADS.INDIRECT_SALARIES) {
                    obj[`fy_${ele.year}`] = ele.operatingCostDetails.indirectSalaries;
                    obj[`id_${ele.year}`] = ele._id;
                }
                if (x.costHead == COST_HEADS.INSURANCE) {
                    obj[`fy_${ele.year}`] = ele.operatingCostDetails.insurance;
                    obj[`id_${ele.year}`] = ele._id;
                }
                if (x.costHead == COST_HEADS.MAINTENANCE_REPAIRS) {
                    obj[`fy_${ele.year}`] = ele.operatingCostDetails.maintenance;
                    obj[`id_${ele.year}`] = ele._id;
                }
                if (x.costHead == COST_HEADS.CONSUMABLES_SPARES) {
                    obj[`fy_${ele.year}`] = ele.operatingCostDetails.consumables;
                    obj[`id_${ele.year}`] = ele._id;
                }
                if (x.costHead == COST_HEADS.ELECTRICITY) {
                    obj[`fy_${ele.year}`] = ele.operatingCostDetails.electricity;
                    obj[`id_${ele.year}`] = ele._id;
                }
                if (x.costHead == COST_HEADS.UTILITY) {
                    obj[`fy_${ele.year}`] = ele.operatingCostDetails.utility;
                    obj[`id_${ele.year}`] = ele._id;
                }
                if (x.costHead == COST_HEADS.MARKETING) {
                    obj[`fy_${ele.year}`] = ele.operatingCostDetails.marketing;
                    obj[`id_${ele.year}`] = ele._id;
                }
                if (x.costHead == COST_HEADS.SALES_DISTRIBUTION) {
                    obj[`fy_${ele.year}`] = ele.operatingCostDetails.salesAndDistribution;
                    obj[`id_${ele.year}`] = ele._id;
                }
                if (x.costHead == COST_HEADS.ADMIN_OTHER) {
                    obj[`fy_${ele.year}`] = ele.operatingCostDetails.adminAndOthers;
                    obj[`id_${ele.year}`] = ele._id;
                }
                lastRow[`fy_${ele.year}`] = ele.totalOperatingCost;
                lastRow[`id_${ele.year}`] = ele._id;
                for (const opex of opexAllocation) {
                    if (opex.particulars == `Total OPEX (Ccy)`) {
                        opex[`fy_${ele.year}`] = ele.totalOperatingCost;
                    }
                    if (opex.particulars == `Allocation % (SBU/Product)`) {
                        opex[`fy_${ele.year}`] = ele.percentageAllocation;
                    }
                    if (opex.particulars == `Total No. of Units Produced`) {
                        opex[`fy_${ele.year}`] = ele.totalUnitsProduced;
                    }
                    if (opex.particulars == `Opex Cost (Ccy)/Unit`) {
                        opex[`fy_${ele.year}`] = ele.opexCostPerUnit;
                    }
                    opex[`id_${ele.year}`] = ele._id;
                }
            }
            delete x.company;
            return obj;
        });
        lastRow.reportingCurrency = currency;
        costHeadList.push(lastRow);
        return res.success({costHeadList, opexAllocation});
    } catch (error) {
        console.error("getAllMasterData Operating Expenses", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getOPEX = async company => {
    try {
        let year = getLastDateOfCurrentFiscalYear().getFullYear();
        year = year % 100;
        let SKUObj = await Model.findOne(
            {year, company},
            {
                opexCostPerUnit: 1
            }
        );
        return SKUObj?.opexCostPerUnit || 0;
    } catch (e) {
        console.error("getOPEX", e);
    }
};
