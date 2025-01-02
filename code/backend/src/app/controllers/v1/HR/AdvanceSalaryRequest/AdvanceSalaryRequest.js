const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/HR/advanceSalaryRequestModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData} = require("../../../../helpers/global.options");
const {getAllAdvanceSalaryAttributes} = require("../../../../models/HR/helpers/advanceSalaryRequestHelper");
const {default: mongoose} = require("mongoose");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {ADVANCE_SALARY_REQUEST} = require("../../../../mocks/schemasConstant/HRConstant");
const {filteredEmployeeList} = require("../../../../models/HR/repository/employeeRepository");
const {getAllAdvSalaryRequestAggregate} = require("../../../../models/HR/repository/advanceSalaryRequestRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllAdvanceSalaryAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    ...(!!req.query.employeeId && {
                        employeeId: ObjectId(req.query.employeeId)
                    })
                }
            },
            {
                $addFields: {
                    requestDateS: {$dateToString: {format: "%d-%m-%Y", date: "$requestDate"}},
                    repayEndMonthYearS: {$dateToString: {format: "%m-%Y", date: "$repayEndMonthYear"}},
                    repayStartMonthYearS: {$dateToString: {format: "%m-%Y", date: "$repayStartMonthYear"}},
                    tenureMonths: {$toString: "$tenureMonths"},
                    repayAmountPerMonth: {$toString: "$repayAmountPerMonth"},
                    amount: {$toString: "$amount"}
                }
            },
            {
                $lookup: {
                    from: "Employee",
                    localField: "employeeId",
                    foreignField: "_id",
                    pipeline: [{$project: {empCode: 1, empFullName: 1}}],
                    as: "employeeId"
                }
            },
            {$unwind: "$employeeId"}
        ];
        let rows = await getAllAdvSalaryRequestAggregate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAllAdvanceSalaryRequest", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    create AdvanceSalaryRequest new Record
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
                message: MESSAGES.apiSuccessStrings.ADDED("Advance Salary Request")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create AdvanceSalaryRequest", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    update AdvanceSalaryRequest  Record
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
            message: `Advance Salary Request has been ${
                itemDetails.status == "Submitted" ? "updated" : itemDetails.status.toLowerCase()
            } successfully`
        });
    } catch (e) {
        console.error("update AdvanceSalaryRequest", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    deleteById AdvanceSalaryRequest Record
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Advance Salary Request")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Advance Salary Request");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById AdvanceSalaryRequest", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getById AdvanceSalaryRequest Record
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Advance Salary Request");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById AdvanceSalaryRequest", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getAllMasterData AdvanceSalaryRequest Record
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            ADVANCE_SALARY_REQUEST.AUTO_INCREMENT_DATA(),
            req.user.company
        );
        const employeesOptions = await filteredEmployeeList([
            {$match: {empStatus: "A", company: ObjectId(req.user.company)}},
            {$sort: {createdAt: 1}},
            {
                $project: {
                    label: {$concat: ["$empCode", "-", "$empFullName"]},
                    value: "$_id",
                    empCode: 1
                }
            }
        ]);
        return res.success({autoIncrementNo, employeesOptions});
    } catch (error) {
        console.error("getAllMasterData AdvanceSalaryRequest", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
