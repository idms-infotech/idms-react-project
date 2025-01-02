const fs = require("fs");
const EmployeeRepository = require("../../../../models/HR/repository/employeeRepository");
const MESSAGES = require("../../../../helpers/messages.options");
const path = require("path");
const {getAutoIncrementNumber, removeFilesInError} = require("../../../../helpers/utility");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const {CONSTANTS} = require("../../../../../config/config");
const {default: mongoose} = require("mongoose");
const {dateToAnyFormat, getEndDateTime, getStartDateTime} = require("../../../../helpers/dateTime");
const {
    getAllEmployeeAttributes,
    getAllEmployeeExcelAttributes,
    getAllEmployeeExitReportAttributes
} = require("../../../../models/HR/helpers/employeeHelper");
const {getAllModuleMaster} = require("../../settings/module-master/module-master");
const {getAllDepartments} = require("../../settings/department/department");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {EMPLOYEE} = require("../../../../mocks/schemasConstant/HRConstant");
const {
    EMP_GENDER,
    EMP_MARITAL_STATUS,
    INDIAN_STATES,
    BOOLEAN_VALUES,
    EMP_ACCOUNT_TYPE
} = require("../../../../mocks/constantData");
const {USER} = require("../../../../mocks/schemasConstant/settingsConstant");
const UserRepository = require("../../../../models/settings/repository/userRepository");
const RoleRepository = require("../../../../models/settings/repository/roleRepository");
const ObjectId = mongoose.Types.ObjectId;
const validationJson = require("../../../../mocks/excelUploadColumn/validation.json");
// @desc    getAll Employee Record
exports.getAll = async (req, res) => {
    try {
        let project = getAllEmployeeAttributes();
        if (req.query.excel == "true") {
            project = getAllEmployeeExcelAttributes();
        }
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company)
                    // empStatus: {$ne: "I"},
                }
            },
            {
                $addFields: {
                    empDOBS: {$dateToString: {format: "%d-%m-%Y", date: "$empDOB"}},
                    empJoiningDateS: {$dateToString: {format: "%d-%m-%Y", date: "$repayEndMonthYear"}}
                }
            },
            {
                $lookup: {
                    from: "Employee",
                    localField: "empReportTo",
                    foreignField: "_id",
                    pipeline: [{$project: {empFullName: 1}}],
                    as: "empReportTo"
                }
            },
            {
                $unwind: {path: "$empReportTo", preserveNullAndEmptyArrays: true}
            }
        ];
        let rows = await EmployeeRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success(rows);
    } catch (e) {
        console.error("getAll Employee", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

// @desc    create Employee new Record
exports.create = async (req, res) => {
    try {
        const {empCode} = req.body;
        const userExists = await UserRepository.findOneDoc({email: empCode, company: req.user.company});
        const employeeExists = await EmployeeRepository.findOneDoc({
            empCode,
            company: req.user.company
        });
        if (userExists || employeeExists) {
            if (
                req.files["empPhoto"] &&
                req.files["empPhoto"].length > 0 &&
                fs.existsSync(req.files["empPhoto"][0].path)
            ) {
                fs.unlinkSync(req.files["empPhoto"][0].path);
            }
            if (
                req.files["empResume"] &&
                req.files["empResume"].length > 0 &&
                fs.existsSync(req.files["empResume"][0].path)
            ) {
                fs.unlinkSync(req.files["empResume"][0].path);
            }
            if (
                req.files["empAadharCard"] &&
                req.files["empAadharCard"].length > 0 &&
                fs.existsSync(req.files["empAadharCard"][0].path)
            ) {
                fs.unlinkSync(req.files["empAadharCard"][0].path);
            }
            if (
                req.files["empPanCard"] &&
                req.files["empPanCard"].length > 0 &&
                fs.existsSync(req.files["empPanCard"][0].path)
            ) {
                fs.unlinkSync(req.files["empPanCard"][0].path);
            }
            if (
                req.files["empExpCertificate"] &&
                req.files["empExpCertificate"].length > 0 &&
                fs.existsSync(req.files["empExpCertificate"][0].path)
            ) {
                fs.unlinkSync(req.files["empExpCertificate"][0].path);
            }
            if (
                req.files["empRelievingLetter"] &&
                req.files["empRelievingLetter"].length > 0 &&
                fs.existsSync(req.files["empRelievingLetter"][0].path)
            ) {
                fs.unlinkSync(req.files["empRelievingLetter"][0].path);
            }
            if (
                req.files["uploadBankPassBook"] &&
                req.files["uploadBankPassBook"].length > 0 &&
                fs.existsSync(req.files["uploadBankPassBook"][0].path)
            ) {
                fs.unlinkSync(req.files["uploadBankPassBook"][0].path);
            }
            if (
                req.files["uploadBankCheckBook"] &&
                req.files["uploadBankCheckBook"].length > 0 &&
                fs.existsSync(req.files["uploadBankCheckBook"][0].path)
            ) {
                fs.unlinkSync(req.files["uploadBankCheckBook"][0].path);
            }
            if (
                req.files["uploadOfferLetter"] &&
                req.files["uploadOfferLetter"].length > 0 &&
                fs.existsSync(req.files["uploadOfferLetter"][0].path)
            ) {
                fs.unlinkSync(req.files["uploadOfferLetter"][0].path);
            }
            if (
                req.files["uploadAppointmentLetter"] &&
                req.files["uploadAppointmentLetter"].length > 0 &&
                fs.existsSync(req.files["uploadAppointmentLetter"][0].path)
            ) {
                fs.unlinkSync(req.files["uploadAppointmentLetter"][0].path);
            }
            let errors = MESSAGES.apiErrorStrings.Data_EXISTS("Employee");
            return res.preconditionFailed(errors);
        }
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        if (createdObj.empPermanentAddress) {
            createdObj.empPermanentAddress = JSON.parse(createdObj.empPermanentAddress);
        }
        if (createdObj.empPresentAddress) {
            createdObj.empPresentAddress = JSON.parse(createdObj.empPresentAddress);
        }
        if (req.files) {
            if (req.files["empPhoto"] && req.files["empPhoto"].length > 0) {
                createdObj["empPhoto"] = req.files["empPhoto"][0].filename;
            }
            if (req.files["empResume"] && req.files["empResume"].length > 0) {
                createdObj["empResume"] = req.files["empResume"][0].filename;
            }
            if (req.files["empAadharCard"] && req.files["empAadharCard"].length > 0) {
                createdObj["empAadharCard"] = req.files["empAadharCard"][0].filename;
            }
            if (req.files["empPanCard"] && req.files["empPanCard"].length > 0) {
                createdObj["empPanCard"] = req.files["empPanCard"][0].filename;
            }
            if (req.files["empExpCertificate"] && req.files["empExpCertificate"].length > 0) {
                createdObj["empExpCertificate"] = req.files["empExpCertificate"][0].filename;
            }
            if (req.files["empRelievingLetter"] && req.files["empRelievingLetter"].length > 0) {
                createdObj["empRelievingLetter"] = req.files["empRelievingLetter"][0].filename;
            }
            if (req.files["uploadBankPassBook"] && req.files["uploadBankPassBook"].length > 0) {
                createdObj["uploadBankPassBook"] = req.files["uploadBankPassBook"][0].filename;
            }
            if (req.files["uploadBankCheckBook"] && req.files["uploadBankCheckBook"].length > 0) {
                createdObj["uploadBankCheckBook"] = req.files["uploadBankCheckBook"][0].filename;
            }
            if (req.files["uploadOfferLetter"] && req.files["uploadOfferLetter"].length > 0) {
                createdObj["uploadOfferLetter"] = req.files["uploadOfferLetter"][0].filename;
            }
            if (req.files["uploadAppointmentLetter"] && req.files["uploadAppointmentLetter"].length > 0) {
                createdObj["uploadAppointmentLetter"] = req.files["uploadAppointmentLetter"][0].filename;
            }
        }
        if (createdObj.isLogin == "true") {
            let role = await RoleRepository.findOneDoc({roleName: "Employee"});
            let user = {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                role: [role._id],
                userCode: "U00001",
                name: `${createdObj.empFirstName} ${createdObj.empLastName}`,
                email: empCode,
                password: CONSTANTS.employeePassword,
                isActive: true
            };
            const createUser = await UserRepository.createDoc(user);
            if (createUser) {
                createdObj.userId = createUser._id;
            }
        }
        createdObj.empFullName = createdObj.empFirstName + " " + createdObj.empLastName;
        const itemDetails = await EmployeeRepository.createDoc(createdObj);
        if (itemDetails) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Employee")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create Employee", e);
        if (req.files) {
            removeFilesInError(req.files["empPhoto"]);
            removeFilesInError(req.files["empResume"]);
            removeFilesInError(req.files["empAadharCard"]);
            removeFilesInError(req.files["empPanCard"]);
            removeFilesInError(req.files["empExpCertificate"]);
            removeFilesInError(req.files["empRelievingLetter"]);
            removeFilesInError(req.files["uploadBankPassBook"]);
            removeFilesInError(req.files["uploadBankCheckBook"]);
            removeFilesInError(req.files["uploadOfferLetter"]);
            removeFilesInError(req.files["uploadAppointmentLetter"]);
        }
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
// @desc    update Employee  Record
exports.update = async (req, res) => {
    try {
        const {empCode} = req.body;
        let employee = await EmployeeRepository.getDocById(req.params.id);
        if (!employee) {
            if (
                req.files["empPhoto"] &&
                req.files["empPhoto"].length > 0 &&
                fs.existsSync(req.files["empPhoto"][0].path)
            ) {
                fs.unlinkSync(req.files["empPhoto"][0].path);
            }
            if (
                req.files["empResume"] &&
                req.files["empResume"].length > 0 &&
                fs.existsSync(req.files["empResume"][0].path)
            ) {
                fs.unlinkSync(req.files["empResume"][0].path);
            }
            if (
                req.files["empAadharCard"] &&
                req.files["empAadharCard"].length > 0 &&
                fs.existsSync(req.files["empAadharCard"][0].path)
            ) {
                fs.unlinkSync(req.files["empAadharCard"][0].path);
            }
            if (
                req.files["empPanCard"] &&
                req.files["empPanCard"].length > 0 &&
                fs.existsSync(req.files["empPanCard"][0].path)
            ) {
                fs.unlinkSync(req.files["empPanCard"][0].path);
            }
            if (
                req.files["empExpCertificate"] &&
                req.files["empExpCertificate"].length > 0 &&
                fs.existsSync(req.files["empExpCertificate"][0].path)
            ) {
                fs.unlinkSync(req.files["empExpCertificate"][0].path);
            }
            if (
                req.files["empRelievingLetter"] &&
                req.files["empRelievingLetter"].length > 0 &&
                fs.existsSync(req.files["empRelievingLetter"][0].path)
            ) {
                fs.unlinkSync(req.files["empRelievingLetter"][0].path);
            }
            if (
                req.files["uploadBankPassBook"] &&
                req.files["uploadBankPassBook"].length > 0 &&
                fs.existsSync(req.files["uploadBankPassBook"][0].path)
            ) {
                fs.unlinkSync(req.files["uploadBankPassBook"][0].path);
            }
            if (
                req.files["uploadBankCheckBook"] &&
                req.files["uploadBankCheckBook"].length > 0 &&
                fs.existsSync(req.files["uploadBankCheckBook"][0].path)
            ) {
                fs.unlinkSync(req.files["uploadBankCheckBook"][0].path);
            }
            if (
                req.files["uploadOfferLetter"] &&
                req.files["uploadOfferLetter"].length > 0 &&
                fs.existsSync(req.files["uploadOfferLetter"][0].path)
            ) {
                fs.unlinkSync(req.files["uploadOfferLetter"][0].path);
            }
            if (
                req.files["uploadAppointmentLetter"] &&
                req.files["uploadAppointmentLetter"].length > 0 &&
                fs.existsSync(req.files["uploadAppointmentLetter"][0].path)
            ) {
                fs.unlinkSync(req.files["uploadAppointmentLetter"][0].path);
            }
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        employee.updatedBy = req.user.sub;
        if (req.body.empPermanentAddress) {
            req.body.empPermanentAddress = JSON.parse(req.body.empPermanentAddress);
        }
        if (req.body.empPresentAddress) {
            req.body.empPresentAddress = JSON.parse(req.body.empPresentAddress);
        }
        if (employee.empStatus == "I" && req.body.empStatus == "A") {
            req.body.empDateOfResignation = null;
            req.body.reasonOfLeaving = null;
        }
        employee = await generateCreateData(employee, req.body);
        let createUser = await UserRepository.findOneDoc({email: empCode, company: req.user.company});

        if (employee.isLogin) {
            if (!createUser) {
                let role = await RoleRepository.findOneDoc({roleName: "Employee"});
                const autoIncrementedNo = await getAndSetAutoIncrementNo(USER.AUTO_INCREMENT_DATA(), req.user.company);
                let user = {
                    company: req.user.company,
                    createdBy: req.user.sub,
                    updatedBy: req.user.sub,
                    role: [role._id],
                    userCode: getAutoIncrementNumber(USER.MODULE.charAt(0), " ", autoIncrementedNo, 4),
                    name: `${employee.empFirstName} ${employee.empLastName}`,
                    email: empCode,
                    password: CONSTANTS.employeePassword,
                    isActive: true
                };
                createUser = await UserRepository.createDoc(user);
                employee.userId = createUser?._id ?? null;
            }
        } else {
            if (createUser) {
                if (createUser.isActive) {
                    await UserRepository.findAndUpdateDoc(
                        {_id: createUser._id},
                        {
                            $set: {
                                isActive: false
                            }
                        },
                        {new: true, useFindAndModify: false}
                    );
                }
            }
        }

        if (employee) {
            employee.userId = createUser?._id ?? null;
            if (req.files) {
                if (req.files["empPhoto"] && req.files["empPhoto"].length > 0) {
                    if (employee.empPhoto) {
                        let destination = path.join(__dirname, `/../../../../../assets/employee/${employee.empPhoto}`);
                        if (fs.existsSync(destination)) {
                            fs.unlinkSync(destination);
                        }
                    }
                    employee["empPhoto"] = req.files["empPhoto"][0].filename;
                }
                if (req.files["empResume"] && req.files["empResume"].length > 0) {
                    if (employee.empResume) {
                        let destination = path.join(__dirname, `/../../../../../assets/employee/${employee.empResume}`);
                        if (fs.existsSync(destination)) {
                            fs.unlinkSync(destination);
                        }
                    }
                    employee["empResume"] = req.files["empResume"][0].filename;
                }
                if (req.files["empAadharCard"] && req.files["empAadharCard"].length > 0) {
                    if (employee.empAadharCard) {
                        let destination = path.join(
                            __dirname,
                            `/../../../../../assets/employee/${employee.empAadharCard}`
                        );
                        if (fs.existsSync(destination)) {
                            fs.unlinkSync(destination);
                        }
                    }
                    employee["empAadharCard"] = req.files["empAadharCard"][0].filename;
                }
                if (req.files["empPanCard"] && req.files["empPanCard"].length > 0) {
                    if (employee.empPanCard) {
                        let destination = path.join(
                            __dirname,
                            `/../../../../../assets/employee/${employee.empPanCard}`
                        );
                        if (fs.existsSync(destination)) {
                            fs.unlinkSync(destination);
                        }
                    }
                    employee["empPanCard"] = req.files["empPanCard"][0].filename;
                }
                if (req.files["empExpCertificate"] && req.files["empExpCertificate"].length > 0) {
                    if (employee.empExpCertificate) {
                        let destination = path.join(
                            __dirname,
                            `/../../../../../assets/employee/${employee.empExpCertificate}`
                        );
                        if (fs.existsSync(destination)) {
                            fs.unlinkSync(destination);
                        }
                    }
                    employee["empExpCertificate"] = req.files["empExpCertificate"][0].filename;
                }
                if (req.files["empRelievingLetter"] && req.files["empRelievingLetter"].length > 0) {
                    if (employee.empRelievingLetter) {
                        let destination = path.join(
                            __dirname,
                            `/../../../../../assets/employee/${employee.empRelievingLetter}`
                        );
                        if (fs.existsSync(destination)) {
                            fs.unlinkSync(destination);
                        }
                    }
                    employee["empRelievingLetter"] = req.files["empRelievingLetter"][0].filename;
                }
                if (req.files["uploadBankPassBook"] && req.files["uploadBankPassBook"].length > 0) {
                    if (employee.uploadBankPassBook) {
                        let destination = path.join(
                            __dirname,
                            `/../../../../../assets/employee/${employee.uploadBankPassBook}`
                        );
                        if (fs.existsSync(destination)) {
                            fs.unlinkSync(destination);
                        }
                    }
                    employee["uploadBankPassBook"] = req.files["uploadBankPassBook"][0].filename;
                }
                if (req.files["uploadBankCheckBook"] && req.files["uploadBankCheckBook"].length > 0) {
                    if (employee.uploadBankCheckBook) {
                        let destination = path.join(
                            __dirname,
                            `/../../../../../assets/employee/${employee.uploadBankCheckBook}`
                        );
                        if (fs.existsSync(destination)) {
                            fs.unlinkSync(destination);
                        }
                    }
                    employee["uploadBankCheckBook"] = req.files["uploadBankCheckBook"][0].filename;
                }
                if (req.files["uploadOfferLetter"] && req.files["uploadOfferLetter"].length > 0) {
                    if (employee.uploadOfferLetter) {
                        let destination = path.join(
                            __dirname,
                            `/../../../../../assets/employee/${employee.uploadOfferLetter}`
                        );
                        if (fs.existsSync(destination)) {
                            fs.unlinkSync(destination);
                        }
                    }
                    employee["uploadOfferLetter"] = req.files["uploadOfferLetter"][0].filename;
                }
                if (req.files["uploadAppointmentLetter"] && req.files["uploadAppointmentLetter"].length > 0) {
                    if (employee.uploadAppointmentLetter) {
                        let destination = path.join(
                            __dirname,
                            `/../../../../../assets/employee/${employee.uploadAppointmentLetter}`
                        );
                        if (fs.existsSync(destination)) {
                            fs.unlinkSync(destination);
                        }
                    }
                    employee["uploadAppointmentLetter"] = req.files["uploadAppointmentLetter"][0].filename;
                }
            }

            employee["empFullName"] = employee["empFirstName"] + " " + employee["empLastName"];

            await employee.save();
            return res.success({
                message: MESSAGES.apiSuccessStrings.UPDATE("Employee has been")
            });
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("update Employee", e);
        if (req.files) {
            removeFilesInError(req.files["empPhoto"]);
            removeFilesInError(req.files["empResume"]);
            removeFilesInError(req.files["empAadharCard"]);
            removeFilesInError(req.files["empPanCard"]);
            removeFilesInError(req.files["empExpCertificate"]);
            removeFilesInError(req.files["empRelievingLetter"]);
            removeFilesInError(req.files["uploadBankPassBook"]);
            removeFilesInError(req.files["uploadBankCheckBook"]);
            removeFilesInError(req.files["uploadOfferLetter"]);
            removeFilesInError(req.files["uploadAppointmentLetter"]);
        }
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
// @desc    deleteById Employee Record
exports.deleteById = async (req, res) => {
    try {
        const deleteItem = await EmployeeRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Employee")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Employee");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Employee", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
exports.getAllMasterData = async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(EMPLOYEE.AUTO_INCREMENT_DATA(), req.user.company);
        const options = await dropDownOptions(req.user.company);
        return res.success({autoIncrementNo, ...options});
    } catch (error) {
        console.error("getAllMasterData Employee", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
const dropDownOptions = async company => {
    try {
        const empDepartmentsOptions = await getAllDepartments(company, {departmentName: 1});
        const empDesignationsOptions = await getAllModuleMaster(company, "EMP_DESIGN");
        const empTypesOptions = await getAllModuleMaster(company, "EMP_TYPE");
        const empGradesOptions = await getAllModuleMaster(company, "EMP_GRADE");
        const empCadresOptions = await getAllModuleMaster(company, "EMP_CADRE");
        const joiningLocationOptions = await getAllModuleMaster(company, "LOCATIONS");
        const employeesOptions = await EmployeeRepository.filteredEmployeeList([
            {$match: {empStatus: "A", company: ObjectId(company)}},
            {$sort: {createdAt: 1}},
            {
                $project: {
                    _id: 0,
                    label: {$concat: ["$empCode", "-", "$empFullName"]},
                    value: "$_id"
                }
            }
        ]);
        return {
            employeesOptions,
            empDesignationsOptions,
            empGradesOptions,
            empTypesOptions,
            empDepartmentsOptions,
            empCadresOptions,
            joiningLocationOptions
        };
    } catch (error) {
        console.error(error);
    }
};
exports.getById = async (req, res) => {
    try {
        let existing = await EmployeeRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Paid Holiday");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Employee", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
exports.employeeExitReport = async (req, res) => {
    try {
        const {fromDate = null, toDate = null} = req.query;
        let project = getAllEmployeeExitReportAttributes();
        let query = {
            company: ObjectId(req.user.company),
            empStatus: "I",
            ...(!!toDate &&
                !!fromDate && {
                    empDateOfResignation: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let pipeline = [
            {
                $match: query
            },
            {
                $addFields: {
                    empDateOfResignationS: {$dateToString: {format: "%d-%m-%Y", date: "$empDateOfResignation"}},
                    empJoiningDateS: {$dateToString: {format: "%d-%m-%Y", date: "$empJoiningDate"}}
                }
            }
        ];
        let rows = await EmployeeRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        return res.success(rows);
    } catch (error) {
        console.error("Error while fetching  Emp exit report ", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.gradeStructure = async (req, res) => {
    const rows = await EmployeeRepository.filteredEmployeeList([
        {
            $match: {
                company: ObjectId(req.user.company),
                empStatus: "A"
            }
        },
        {
            $group: {
                _id: "$empGrade",
                employees: {
                    $push: {
                        empFullName: "$$ROOT.empFullName",
                        empCode: "$$ROOT.empCode"
                    }
                }
            }
        }
    ]);
    const empGrades = await getAllModuleMaster(req.user.company, "EMP_GRADE");
    return res.success({
        rows,
        grades: empGrades.map(x => x.label)
    });
};
exports.employeeDepartmentWiseStructure = async (req, res) => {
    try {
        const {employeeId} = req.query;
        let emp = await EmployeeRepository.getDocById(employeeId);
        const rows = await EmployeeRepository.filteredEmployeeList([
            {
                $match: {
                    $or: [{empDepartment: emp.empDepartment}, {empGrade: "1 - CEO/ED/MD"}],
                    company: ObjectId(req.user.company),
                    empStatus: {$in: ["A"]}
                }
            },
            {
                $group: {
                    _id: "$empGrade",
                    employees: {
                        $push: {
                            empFullName: "$$ROOT.empFullName",
                            empCode: "$$ROOT.empCode"
                        }
                    }
                }
            }
        ]);
        const empGrades = await getAllModuleMaster(req.user.company, "EMP_GRADE");
        return res.success({
            rows,
            grades: empGrades.map(x => x.label)
        });
    } catch (error) {
        console.error(error);
    }
};

exports.findAllEmployees = async () => {
    let rows = await EmployeeRepository.filteredEmployeeList([
        {$match: {empStatus: "A"}},
        {
            $project: {
                empCode: 1,
                empFullName: 1,
                empDesignation: 1,
                empJoiningDate: 1,
                empJoiningLocation: 1,
                empReportTo: 1,
                empCadre: 1,
                empGender: 1,
                empDOB: 1,
                empEmailCompany: 1,
                empGrade: 1,
                empDepartment: 1,
                empType: 1
            }
        },
        {$sort: {createdAt: +1}}
    ]);
    return rows;
};
exports.getEmployeeById = async employeeId => {
    try {
        const employee = await EmployeeRepository.findOneDoc({_id: employeeId});
        return employee;
    } catch (error) {
        console.error(error);
    }
};
exports.getEmployeeCounts = async company => {
    try {
        const result = await EmployeeRepository.filteredEmployeeList([
            {
                $match: {
                    company: ObjectId(company),
                    empStatus: "A"
                }
            },
            {
                $group: {
                    _id: null,
                    maleEmployees: {$sum: {$cond: [{$eq: ["$empGender", "Male"]}, 1, 0]}},
                    femaleEmployees: {$sum: {$cond: [{$eq: ["$empGender", "Female"]}, 1, 0]}}
                }
            },
            {
                $project: {
                    _id: 0,
                    maleEmployees: 1,
                    femaleEmployees: 1,
                    activeEmployees: {$sum: ["$maleEmployees", "$femaleEmployees"]}
                }
            }
        ]);
        return result.length > 0 ? result[0] : [];
    } catch (error) {
        console.error("Not able to get record ", error);
    }
};

exports.getTotalNoOfEmployeesPerDay = async company => {
    const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
    const rows = await EmployeeRepository.filteredEmployeeList([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$createdAt"}}
            }
        },
        {
            $match: {
                company: ObjectId(company),
                matchDate: currentDate
            }
        },
        {
            $group: {
                _id: null,
                count: {$sum: {$cond: [{$eq: ["$empStatus", "A"]}, 1, 0]}}
            }
        },
        {
            $project: {
                _id: 0,
                count: 1
            }
        }
    ]);
    return rows[0]?.count || 0;
};

exports.checkEmployeeValidation = async (empData, column, company) => {
    try {
        const employeesOptions = await EmployeeRepository.filteredEmployeeList([
            {$match: {empStatus: "A", company: ObjectId(company)}},
            {
                $project: {
                    empFirstName: 1,
                    empLastName: 1
                }
            }
        ]);
        const requiredFields = [
            "empFirstName",
            "empLastName",
            "empGender",
            "empJoiningDate",
            "empDesignation",
            "empDepartment"
        ];
        const falseArr = OPTIONS.falsyArray;
        let {
            // employeesOptions,
            empDesignationsOptions,
            empGradesOptions,
            empTypesOptions,
            empDepartmentsOptions,
            empCadresOptions,
            joiningLocationOptions
        } = await dropDownOptions(company);
        let dropdownCheck = [
            {
                key: "empGender",
                options: EMP_GENDER
            },
            {
                key: "empMartialStatus",
                options: EMP_MARITAL_STATUS
            },
            {
                key: "state",
                options: INDIAN_STATES.map(x => {
                    return {
                        label: x,
                        value: x
                    };
                })
            },
            {
                key: "empJoiningLocation",
                options: joiningLocationOptions
            },
            {
                key: "empCadre",
                options: empCadresOptions.map(x => {
                    return {
                        label: x.label,
                        value: x.value
                    };
                })
            },
            {
                key: "empDesignation",
                options: empDesignationsOptions.map(x => {
                    return {
                        label: x.label,
                        value: x.value
                    };
                })
            },
            {
                key: "empDepartment",
                options: empDepartmentsOptions.map(x => {
                    return {
                        label: x.departmentName,
                        value: x.departmentName
                    };
                })
            },
            {
                key: "empType",
                options: empTypesOptions.map(x => {
                    return {
                        label: x.label,
                        value: x.value
                    };
                })
            },
            {
                key: "empGrade",
                options: empGradesOptions.map(x => {
                    return {
                        label: x.label,
                        value: x.value
                    };
                })
            },
            {
                key: "empOTApplicability",
                options: [
                    {
                        label: BOOLEAN_VALUES.YES,
                        value: BOOLEAN_VALUES.YES
                    },
                    {
                        label: BOOLEAN_VALUES.NO,
                        value: BOOLEAN_VALUES.NO
                    }
                ]
            },
            {
                key: "empAccType",
                options: EMP_ACCOUNT_TYPE
            }
        ];
        for await (const x of empData) {
            x.isValid = true;
            x.message = null;
            for (const ele of Object.values(column)) {
                if (requiredFields.includes(ele) && falseArr.includes(x[ele])) {
                    x.isValid = false;
                    x.message = validationJson[ele] ?? `${ele} is Required`;
                    break;
                }
                for (const dd of dropdownCheck) {
                    if (ele == dd.key && !dd.options.map(values => values.value).includes(x[ele])) {
                        x.isValid = false;
                        x.message = `${ele} is Invalid Value & Value Must be ${dd.options.map(values => values.value)}`;
                        break;
                    }
                }
                for (const ele of employeesOptions) {
                    if (ele.empFirstName == x["empFirstName"] && ele.empLastName == x["empLastName"]) {
                        x.isValid = false;
                        x.message = `${x["empFirstName"]} already exists`;
                        break;
                    }
                }
            }
        }
        const inValidRecords = empData.filter(x => !x.isValid);
        const validRecords = empData.filter(x => x.isValid);
        return {inValidRecords, validRecords};
    } catch (error) {
        console.error(error);
    }
};

exports.bulkInsertEmployeeByCSV = async (jsonData, {company, createdBy, updatedBy}) => {
    try {
        // const employeesOptions = await EmployeeRepository.filteredEmployeeList([
        //     {$match: {empStatus: "A", company: ObjectId(company)}},
        //     {
        //         $project: {
        //             _id: 0,
        //             label: "$empFullName",
        //             value: "$_id"
        //         }
        //     }
        // ]);
        // let missingEmployeeReportToName = [];
        for (const ele of jsonData) {
            // for (const employee of employeesOptions) {
            //     if (ele.empReportTo.trim() == employee.label) {
            //         ele.empReportTo = employee.value.valueOf();
            //     }
            // }
            // if (!ele.empReportTo) {
            //     missingEmployeeReportToName.push(ele.empReportTo);
            // }
            if (!!ele.empDOB) {
                ele.empDOB = dateToAnyFormat(ele.empDOB, "YYYY-MM-DD");
            } else {
                ele.empDOB = null;
            }
            // if (!!ele.empSpouseDOB) {
            //     ele.empSpouseDOB = dateToAnyFormat(ele.empSpouseDOB, "YYYY-MM-DD");
            // } else {
            //     ele.empSpouseDOB = null;
            // }
            // if (!!ele.empFatherDOB) {
            //     ele.empFatherDOB = dateToAnyFormat(ele.empFatherDOB, "YYYY-MM-DD");
            // } else {
            //     ele.empFatherDOB = null;
            // }
            // if (!!ele.empMotherDOB) {
            //     ele.empMotherDOB = dateToAnyFormat(ele.empMotherDOB, "YYYY-MM-DD");
            // } else {
            //     ele.empMotherDOB = null;
            // }
            if (!!ele.empJoiningDate) {
                ele.empJoiningDate = dateToAnyFormat(ele.empJoiningDate, "YYYY-MM-DD");
            } else {
                ele.empJoiningDate = null;
            }
        }
        let employeeData = jsonData.map(x => {
            const {line1, line2, line3, state, city, pinCode, country, ...rest} = x;
            let address = {
                line1,
                line2,
                line3,
                state,
                city,
                pinCode,
                country
            };
            rest.empPermanentAddress = [address];
            rest.empPresentAddress = [address];
            rest.company = company;
            rest.createdBy = createdBy;
            rest.updatedBy = updatedBy;
            rest.empCode = "0000";
            return rest;
        });
        for await (const item of employeeData) {
            await EmployeeRepository.createDoc(item);
        }
        return {message: "Employees Uploaded successfully!"};
    } catch (error) {
        console.error(error);
    }
};

function formatDateForExcel(inputDate) {
    const [day, month, year] = inputDate.split("-");
    return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
}
