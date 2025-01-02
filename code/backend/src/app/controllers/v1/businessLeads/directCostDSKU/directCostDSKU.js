const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {OPTIONS} = require("../../../../helpers/global.options");
const {getAllDirectCostDSKUAttributes} = require("../../../../models/businessLeads/helpers/directCostDSKUHelper");
const {getAllProcessMasterForDirectCost} = require("../../planning/processMaster/processMaster");
const {default: mongoose} = require("mongoose");
const {getAllMapCategoryHSN} = require("../../sales/mapCategoryHSNMaster/mapCategoryHSN");
// const {getAllDSKUByCategory} = require("../NPDMaster/NPDMasters");
const {DIRECT_COST_DSKU} = require("../../../../mocks/schemasConstant/businessLeadsConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const DirectCostDSKURepository = require("../../../../models/businessLeads/repository/directCostDSKURepository");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllDirectCostDSKUAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await DirectCostDSKURepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.create = asyncHandler(async (req, res) => {
    try {
        let exists = await DirectCostDSKURepository.findOneDoc(
            {
                DSKU: req.body.DSKU
            },
            {_id: 1}
        );
        if (exists) {
            let errors = MESSAGES.apiErrorStrings.Data_EXISTS("D-SKU");
            return res.preconditionFailed(errors);
        }
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        const itemDetails = await DirectCostDSKURepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Direct Cost DSKU")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Direct Cost DSKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await DirectCostDSKURepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        await DirectCostDSKURepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Direct Cost DSKU has been")
        });
    } catch (e) {
        console.error("update Direct Cost DSKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await DirectCostDSKURepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Direct Cost DSKU")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Direct Cost DSKU");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Direct Cost DSKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await DirectCostDSKURepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Direct Cost DSKU");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Direct Cost DSKU", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            {...DIRECT_COST_DSKU.AUTO_INCREMENT_DATA()},
            req.user.company
        );
        const processList = await getAllProcessMasterForDirectCost(req.user.company);
        const productCategories = await getAllMapCategoryHSN(
            {status: OPTIONS.defaultStatus.ACTIVE, company: req.user.company},
            {productCategory: 1}
        );
        return res.success({autoIncrementNo, processList, productCategories});
    } catch (error) {
        console.error("getAllMasterData Direct Cost DSKU", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getDSKUData = asyncHandler(async (req, res) => {
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
        console.error("getDSKUData", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getTotalCostByDSKUId = async (company, DSKU) => {
    try {
        let DSKUObj = await DirectCostDSKURepository.findOneDoc(
            {company, DSKU},
            {
                totalDirectExpenses: {
                    $round: [{$sum: ["$totalAssetCostPerUnit", "$totalToolingCostPerUnit"]}, 2]
                },
                totalLabourCostPerUnit: 1,
                _id: 0
            }
        );
        return DSKUObj ?? {totalLabourCostPerUnit: 0, totalDirectExpenses: 0};
    } catch (e) {
        console.error("getTotalCostByDSKUId", e);
    }
};

exports.checkSKUExistsByDSKUId = asyncHandler(async (req, res) => {
    try {
        let exists = await DirectCostDSKURepository.findOneDoc(
            {
                DSKU: req.params.id
            },
            {_id: 1}
        );
        if (exists) {
            let errors = MESSAGES.apiErrorStrings.Data_EXISTS("D-SKU");
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
