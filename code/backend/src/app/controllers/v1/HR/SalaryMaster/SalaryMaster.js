const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/HR/salaryMasterModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData} = require("../../../../helpers/global.options");
const {getAllSalaryComponents} = require("../SalaryComponent/SalaryComponent");
const {getCurrentFinancialYear} = require("../../../../utilities/utility");
const {dateToAnyFormat} = require("../../../../helpers/dateTime");
const {getAllSalaryMasterAttributes} = require("../../../../models/HR/helpers/salaryMasterHelper");
const {default: mongoose} = require("mongoose");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {SALARY_MASTER} = require("../../../../mocks/schemasConstant/HRConstant");
const {findOneStatutoryContribution} = require("../../../../models/HR/repository/statutoryContributionsRepository");
const {filteredEmployeeList} = require("../../../../models/HR/repository/employeeRepository");
const {getAllSalaryMasterAggregate} = require("../../../../models/HR/repository/salaryMasterRepository");
const ObjectId = mongoose.Types.ObjectId;

// @desc    getAll SalaryMaster Record
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let project = getAllSalaryMasterAttributes();
        let pipeline = [
            {$match: {company: ObjectId(req.user.company), isOld: false}},
            {
                $addFields: {
                    effectFromDateS: {$dateToString: {format: "%d-%m-%Y", date: "$effectFromDate"}},
                    grossSalaryPerMonth: {$toString: "$grossSalaryPerMonth"}
                }
            },
            {
                $lookup: {
                    from: "Employee",
                    localField: "employeeId",
                    foreignField: "_id",
                    pipeline: [{$project: {empCode: 1, empFullName: 1, empDepartment: 1}}],
                    as: "employeeId"
                }
            },
            {$unwind: "$employeeId"}
        ];
        let output = await getAllSalaryMasterAggregate({pipeline, project, queryParams: req.query});
        let extraColumns = [];
        const salaryComponents = await getAllSalaryComponents(req.user.company);
        output.rows = JSON.parse(JSON.stringify(output.rows)).map((ele, index) => {
            for (let i = 0; i < ele.salaryComponentDetails.length; i++) {
                const element = ele.salaryComponentDetails[i];
                let salaryComponent =
                    salaryComponents.find(x => String(x._id) == String(element.salaryComponentId)) ?? {};
                ele[salaryComponent?.abbreviation] = element?.salaryComponentPerMonth;
                if (index == 0) {
                    extraColumns.push(salaryComponent?.abbreviation);
                }
            }
            return ele;
        });
        return res.success({
            extraColumns,
            ...output
        });
    } catch (e) {
        console.error("getById SalaryMaster", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    create SalaryMaster new Record
exports.create = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findOne(
            {
                employeeId: req.body.employeeId
            },
            {_id: 1}
        );
        if (existing) {
            let errors = MESSAGES.apiErrorStrings.Data_EXISTS("Salary Master");
            return res.preconditionFailed(errors);
        }
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body,
            financialYear: getCurrentFinancialYear()
        };
        const saveObj = new Model(createdObj);

        const itemDetails = await saveObj.save();
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Salary Master")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create SalaryMaster", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    update SalaryMaster  Record
exports.update = asyncHandler(async (req, res) => {
    try {
        let salaryMaster = await Model.findById(req.params.id);
        if (salaryMaster) {
            salaryMaster.updatedBy = req.user.sub;
            salaryMaster.financialYear = getCurrentFinancialYear();
            let flag = dateToAnyFormat(salaryMaster.effectFromDate, "YYYY-MM-DD") != req.body.effectFromDate;
            salaryMaster = await generateCreateData(salaryMaster, req.body);
            if (flag) {
                let oldSM = {...JSON.parse(JSON.stringify(salaryMaster))};
                oldSM.isOld = true;
                delete oldSM._id;
                await Model.create(oldSM);
            }
            await salaryMaster.save();
            return res.success({
                message: MESSAGES.apiSuccessStrings.UPDATE("Salary Master has been")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("update SalaryMaster", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    deleteById SalaryMaster Record
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Salary Master")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Salary Master");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById SalaryMaster", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getById SalaryMaster Record
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id)
            .populate("employeeId", "_id empCode empFullName")
            .populate("salaryComponentDetails.salaryComponentId");
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Salary Master");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById SalaryMaster", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getAllMasterData SalaryMaster Record
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(SALARY_MASTER.AUTO_INCREMENT_DATA(), req.user.company);
        const employeesOptions = await filteredEmployeeList([
            {$match: {empStatus: "A", company: ObjectId(req.user.company)}},
            {$sort: {createdAt: 1}},
            {
                $project: {
                    _id: 0,
                    label: {$concat: ["$empCode", "-", "$empFullName"]},
                    value: "$_id"
                }
            }
        ]);
        const salaryComponents = await getAllSalaryComponents(req.user.company);
        let statutoryData = await findOneStatutoryContribution(
            {company: ObjectId(req.user.company)},
            {
                employeeContributionRate: "$employeeProvidentFund.employeeContributionRate"
            }
        );
        return res.success({
            autoIncrementNo,
            employeesOptions,
            salaryComponents,
            employeeContributionRate: statutoryData.employeeContributionRate
        });
    } catch (error) {
        console.error("getAllMasterData SalaryMaster", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getAllSalaryMasters SalaryMaster Record
exports.findSalaryMasters = asyncHandler(async financialYear => {
    try {
        const salaryMaster = await Model.aggregate([
            {
                $lookup: {
                    from: "employees",
                    localField: "employeeId",
                    foreignField: "_id",
                    as: "employeeId"
                }
            },
            {$unwind: {path: "$employeeId"}},
            {$match: {"employeeId.empStatus": "A"}}
        ]);
        return salaryMaster;
    } catch (error) {
        console.error(error);
    }
});
