const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/HR/salaryComponentsModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {outputData, getAllAggregationFooter} = require("../../../../helpers/utility");
const {generateCreateData, getMatchData, OPTIONS} = require("../../../../helpers/global.options");
const {getAllSalaryComponentsAttributes} = require("../../../../models/HR/helpers/salaryComponentsHelper");
const {default: mongoose} = require("mongoose");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {SALARY_COMPONENTS} = require("../../../../mocks/schemasConstant/HRConstant");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {getAllSalaryComponentsAggregate} = require("../../../../models/HR/repository/salaryComponentsRepository");
const ObjectId = mongoose.Types.ObjectId;

// @desc    getAll SalaryComponent Record
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllSalaryComponentsAttributes();
        let pipeline = [{$match: {company: ObjectId(req.user.company)}}];
        let rows = await getAllSalaryComponentsAggregate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAll SalaryComponent", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    create SalaryComponent new Record
exports.create = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findOne({
            earningHead: req.body.earningHead
        });
        if (existing) {
            let errors = MESSAGES.apiErrorStrings.Data_EXISTS("Salary Component");
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
                message: MESSAGES.apiSuccessStrings.ADDED("Salary Component")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create SalaryComponent", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    update SalaryComponent  Record
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await Model.findById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await generateCreateData(itemDetails, req.body);
        itemDetails = await itemDetails.save();
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Salary Component has been")
        });
    } catch (e) {
        console.error("update SalaryComponent", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    deleteById SalaryComponent Record
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Salary Component")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Salary Component");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById SalaryComponent", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getById SalaryComponent Record
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Salary Component");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById SalaryComponent", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getAllMasterData SalaryComponent Record
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            SALARY_COMPONENTS.AUTO_INCREMENT_DATA(),
            req.user.company
        );
        const earningHeadOptions = await getAllModuleMaster(req.user.company, "EARNING_HEAD");
        return res.success({
            autoIncrementNo,
            earningHeadOptions
        });
    } catch (error) {
        console.error("getAllMasterData SalaryComponent", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getAllSalaryComponents SalaryComponent Record
exports.getAllSalaryComponents = asyncHandler(async company => {
    try {
        let rows = await Model.find({
            status: OPTIONS.defaultStatus.ACTIVE,
            company: company
        }).sort({createdAt: -1});
        return rows;
    } catch (e) {
        console.error("getAllSalaryComponents", e);
    }
});
