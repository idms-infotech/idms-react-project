const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {OPTIONS} = require("../../../../helpers/global.options");
const {default: mongoose} = require("mongoose");
const {getAllCostSheetAttributes} = require("../../../../models/settings/helpers/costSheetHelper");
const {COST_SHEET} = require("../../../../mocks/schemasConstant/settingsConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {filteredSKUMasterList} = require("../../../../models/sales/repository/SKUMasterRepository");
const {filterNPDMasterList} = require("../../../../models/businessLeads/repository/NPDMasterRepository");
const CostSheetRepository = require("../../../../models/settings/repository/costSheetRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllCostSheetAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await CostSheetRepository.getAllPaginate({pipeline, project, queryParams: req.query});
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
        const itemDetails = await CostSheetRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("CostSheet")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create CostSheet", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await CostSheetRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        await CostSheetRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("CostSheet has been")
        });
    } catch (e) {
        console.error("update CostSheet", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await CostSheetRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("CostSheet");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById CostSheet", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await CostSheetRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("CostSheet")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("CostSheet");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById CostSheet", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(COST_SHEET.AUTO_INCREMENT_DATA(), req.user.company);
        return res.success({
            autoIncrementNo
        });
    } catch (error) {
        console.error("getAllMasterData CostSheet", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllSKUCostEstimateMasterData = asyncHandler(async (req, res) => {
    try {
        const costSheetList = await this.getAllCostSheet(req.user.company, {
            componentType: 1,
            order: 1,
            costElement: 1,
            tooltip: 1,
            componentCode: 1
        });
        const SKUOptions = await filteredSKUMasterList([
            {$match: {company: ObjectId(req.user.company), isActive: "A"}},
            {$sort: {createdAt: -1}},
            {$project: {SKUNo: 1, SKUName: 1, SKUDescription: 1, primaryUnit: 1, _id: 1}}
        ]);
        return res.success({
            costSheetList,
            SKUOptions
        });
    } catch (error) {
        console.error("getAllMasterData CostSheet", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllDSKUCostEstimateMasterData = asyncHandler(async (req, res) => {
    try {
        const costSheetList = await this.getAllCostSheet(req.user.company, {
            componentType: 1,
            order: 1,
            costElement: 1,
            tooltip: 1,
            componentCode: 1
        });
        const DSKUOptions = await filterNPDMasterList([
            {$match: {isActive: "A", company: ObjectId(req.user.company)}},
            {$sort: {createdAt: -1}},
            {$project: {dSKUNo: 1, SKUName: 1, SKUDescription: 1, primaryUnit: 1, _id: 1}}
        ]);
        return res.success({
            costSheetList,
            DSKUOptions
        });
    } catch (error) {
        console.error("getAllMasterData CostSheet", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllCostSheet = async (company, project = {}) => {
    try {
        let directObj = {
            componentType: "Direct",
            costElement: "Total Direct Cost (1+2+3+4)",
            order: null,
            tooltip: null,
            isTotal: true,
            SKUUnit: null
        };
        let indirectObj = {
            order: null,
            componentType: "Indirect",
            costElement: "Total Indirect Cost",
            tooltip: null,
            isTotal: true,
            SKUUnit: null
        };
        let totalObj = {
            order: null,
            componentType: "Direct + Indirect",
            costElement: "Total Cost Per SKU Unit (5+9)",
            tooltip: null,
            isTotal: true,
            SKUUnit: null
        };
        let rows = await CostSheetRepository.filteredCostSheetList([
            {
                $match: {
                    status: OPTIONS.defaultStatus.ACTIVE,
                    company: ObjectId(company)
                }
            },
            {
                $sort: {order: 1, componentType: 1}
            },
            {
                $project: project
            }
        ]);
        rows = rows.map(x => {
            x.isTotal = false;
            return x;
        });
        rows.push(directObj);
        rows = rows.sort((a, b) => a.componentType.localeCompare(b.componentType));
        rows.push(indirectObj, totalObj);
        rows = rows.map(ele => {
            ele.costPerSKUUnit = 0;
            ele.percentage = 0;
            return ele;
        });

        return rows;
    } catch (e) {
        console.error("getAllCostSheet", e);
    }
};
