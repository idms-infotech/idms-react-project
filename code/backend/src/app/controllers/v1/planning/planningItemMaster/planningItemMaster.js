const {ObjectId} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {getAllPlanningItemMasterAttributes} = require("../../../../models/planning/helpers/planningItemMasterHelper");
const PlanningItemMasterRepository = require("../../../../models/planning/repository/planningItemMasterRepository");
const {OPTIONS} = require("../../../../helpers/global.options");
const {filteredHSNList} = require("../../../../models/purchase/repository/hsnRepository");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {getIncrementNumWithPrefix} = require("../../../../helpers/utility");
const {filteredJWPrincipalList} = require("../../../../models/planning/repository/JWPrincipalRepository");
const {getAllItemCategoryJP} = require("../../settings/itemCategoryJP/itemCategoryJP");

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllPlanningItemMasterAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await PlanningItemMasterRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
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
        const itemDetails = await PlanningItemMasterRepository.createDoc(createdObj);
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Item Master (JP09)")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Item Master (JP09)", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await PlanningItemMasterRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await PlanningItemMasterRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Item Master (JP09) has been")
        });
    } catch (e) {
        console.error("update Item Master (JP09)", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await PlanningItemMasterRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Item Master (JP09)")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Item Master (JP09)");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Item Master (JP09)", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await PlanningItemMasterRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Item Master (JP09)");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Item Master (JP09)", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const QCLevelsOptions = await getAllModuleMaster(req.user.company, "QUALITY_CONTROL_LEVEL");
        const HSNCodesOptions = await filteredHSNList([
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
                    sgstRate: 1,
                    ugstRate: 1
                }
            }
        ]);
        const JWPrincipalOptions = await filteredJWPrincipalList([
            {$match: {company: ObjectId(req.user.company), status: OPTIONS.defaultStatus.ACTIVE}},
            {$sort: {JWPrincipalName: 1}},
            {
                $project: {
                    label: "$JWPrincipalName",
                    value: "$_id",
                    currency: "$currency",
                    JWPrincipalCode: 1,
                    state: "$primaryAddress.state",
                    cityOrDistrict: "$primaryAddress.city",
                    pinCode: "$primaryAddress.pinCode"
                }
            }
        ]);
        let itemCategories = await getAllItemCategoryJP(req.user.company);
        let autoIncValues = {};
        if (itemCategories.length > 0) {
            for (const ele of itemCategories) {
                autoIncValues[ele.category] = getIncrementNumWithPrefix({
                    modulePrefix: ele.prefix,
                    autoIncrementValue: ele.nextAutoIncrement,
                    digit: ele.digit
                });
            }
            itemCategories = itemCategories.map(x => x?.category);
        }
        return res.success({autoIncValues, QCLevelsOptions, HSNCodesOptions, itemCategories, JWPrincipalOptions});
    } catch (error) {
        console.error("getAllMasterData Item Master (JP09)", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
