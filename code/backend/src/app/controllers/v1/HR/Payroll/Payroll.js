const Model = require("../../../../models/HR/salaryPayrollModel");
const SalaryMaster = require("../../../../models/HR/salaryMasterModel");
const EmployeeAttendance = require("../../../../models/HR/employeeAttendanceModel");
const AdvanceSalaryRequest = require("../../../../models/HR/advanceSalaryRequestModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {findAllEmployees} = require("../employee/Employee");
const {db} = require("../../../../../config/mongoose");
const {default: mongoose} = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const {
    getFirstDateOfCurrentFiscalYear,
    getLastDateOfCurrentFiscalYear,
    getFiscalMonthsName
} = require("../../../../utilities/utility");
const {
    getPreviousMonthStartDate,
    getEndDateTime,
    getStartDateTime,
    dateToAnyFormat
} = require("../../../../helpers/dateTime");
const {
    getAllPayrollReportsAttributes,
    getAllSalarySlipReportsAttributes
} = require("../../../../models/HR/helpers/payrollHelper");
const {getPTForSalaryPayroll} = require("../StatutoryContributionsSetup/StatutoryContributionsSetup");
const {LAKH} = require("../../../../mocks/number.constant");
const SalaryPayrollRepository = require("../../../../models/HR/repository/salaryPayrollRepository");
const expressAsyncHandler = require("express-async-handler");
const {filteredEmployeeList} = require("../../../../models/HR/repository/employeeRepository");

exports.create = async (req, res) => {
    const session = await db.startSession();
    try {
        session.startTransaction();
        for await (const element of req.body) {
            let itemDetails = await Model.findById(element._id);
            if (element._id && itemDetails) {
                // update
                itemDetails.updatedBy = req.user.sub;
                Object.keys(element).forEach((key, index) => {
                    itemDetails[key] = element[key];
                });
                await itemDetails.save();
            } else {
                // create
                delete element._id;
                let createdObj = {
                    company: req.user.company,
                    createdBy: req.user.sub,
                    updatedBy: req.user.sub,
                    ...element
                };
                const saveObj = new Model(createdObj);
                await saveObj.save();
            }
        }
        await session.commitTransaction();
        return res.success({
            message: "Payroll added successfully !"
        });
    } catch (e) {
        console.error("create Payroll", e);
        await session.abortTransaction();
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
    session.endSession();
};

exports.update = async (req, res) => {
    try {
        let itemDetails = await Model.findById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails = await generateCreateData(itemDetails, req.body);
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await itemDetails.save();
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Payroll has been")
        });
    } catch (e) {
        console.error("update Payroll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.deleteById = async (req, res) => {
    try {
        const deleteItem = await Model.findById(req.params.id);
        if (deleteItem) {
            await deleteItem.remove();
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Payroll")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Payroll");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById Payroll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getById = async (req, res) => {
    try {
        let existing = await Model.findById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Payroll");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Payroll", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
// exports.getByIdForSlip = async (req, res) => {
//     try {
//         let existing = await SalaryPayrollRepository.filteredSalaryPayrollList([
//             {
//                 $match: {
//                     _id: ObjectId(req.params.id)
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "Employee",
//                     localField: "employeeId",
//                     foreignField: "_id",
//                     pipeline: [
//                         {
//                             $project: {
//                                 empDesignation: 1,
//                                 empJoiningLocation: 1,
//                                 empPFNo: 1,
//                                 empESICNo: 1,
//                                 empAccountNumber: 1
//                             }
//                         }
//                     ],
//                     as: "employee"
//                 }
//             },
//             {$unwind: "$employee"},
//             {
//                 $lookup: {
//                     from: "EmployeeAttendance",
//                     localField: "employeeId",
//                     foreignField: "employeeId",
//                     pipeline: [
//                         {
//                             $match: {
//                                 status: OPTIONS.defaultStatus.APPROVED
//                             }
//                         },
//                         {
//                             $project: {
//                                 presentDays: 1,
//                                 LOPDiff: 1
//                             }
//                         }
//                     ],
//                     as: "employeeAttendance"
//                 }
//             },
//             {$unwind: "$employeeAttendance"},
//             {
//                 $lookup: {
//                     from: "SalaryMaster",
//                     localField: "employeeId",
//                     foreignField: "employeeId",
//                     pipeline: [
//                         {
//                             $project: {
//                                 salaryComponentDetails: 1
//                             }
//                         }
//                     ],
//                     as: "salaryMaster"
//                 }
//             },
//             {$unwind: "$salaryMaster"},
//             {
//                 $lookup: {
//                     from: "Company",
//                     localField: "company",
//                     foreignField: "_id",
//                     pipeline: [
//                         {
//                             $project: {
//                                 _id: 1,
//                                 companyName: 1,
//                                 logoUrl: {$concat: [`${CONSTANTS.domainUrl}company/`, "$logo"]}
//                             }
//                         }
//                     ],
//                     as: "company"
//                 }
//             },
//             {$unwind: "$company"},
//             {
//                 $project: {
//                     empDesignation: "$employee.empDesignation",
//                     empJoiningLocation: "$employee.empJoiningLocation",
//                     empPFNo: "$employee.empPFNo",
//                     empESICNo: "$employee.empESICNo",
//                     empAccountNumber: "$employee.empAccountNumber",
//                     presentDays: "$employeeAttendance.presentDays",
//                     LOPDiff: "$employeeAttendance.LOPDiff",
//                     salaryComponentDetails: "$salaryMaster.salaryComponentDetails",
//                     companyName: "$company.companyName",
//                     logoUrl: "$company.logoUrl",
//                     PF: 1,
//                     ESIC: 1,
//                     TDS: 1,
//                     PT: 1,
//                     advSalary: 1
//                 }
//             }
//         ]);
//         if (!existing.length) {
//             let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Payroll");
//             return res.unprocessableEntity(errors);
//         } else {
//             existing = existing[0];
//         }
//         return res.success(existing);
//     } catch (e) {
//         console.error("getById Payroll", e);
//         const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
//         return res.serverError(errors);
//     }
// };

exports.getAllMasterData = async (req, res) => {
    try {
        let date = req.params.date;
        let startDate = new Date(date);
        let salaryPayrollOfMonth = [];
        salaryPayrollOfMonth = await Model.find({
            company: req.user.company,
            payrollForMonthYear: new Date(startDate)
        }).sort({employeeCode: 1});
        if (salaryPayrollOfMonth.length == 0) {
            let employeeAttendanceRecords = await EmployeeAttendance.find({
                company: req.user.company,
                status: OPTIONS.defaultStatus.APPROVED,
                attendanceForMonthYear: new Date(startDate)
            }).populate("employeeId", "_id  empFullName empDepartment empGender empDesignation");
            let salaryMasterRecords = await SalaryMaster.find({
                company: req.user.company,
                isOld: false
            }).populate("salaryComponentDetails.salaryComponentId", "_id abbreviation earningHead status");
            let PTArrayStateWise = await getPTForSalaryPayroll(req.user.company);
            for (let i = 0; i < salaryMasterRecords.length; i++) {
                let salaryMaster = salaryMasterRecords[i];
                let employeeAttendance = employeeAttendanceRecords.find(
                    x => String(x.employeeId?._id) == String(salaryMaster?.employeeId)
                );
                let advanceSalaryRequest = await AdvanceSalaryRequest.aggregate([
                    {
                        $match: {
                            company: ObjectId(req.user.company),
                            employeeId: ObjectId(salaryMaster.employeeId),
                            status: OPTIONS.defaultStatus.APPROVED,
                            repayStartMonthYear: {
                                $lte: getEndDateTime(startDate)
                            },
                            repayEndMonthYear: {
                                $gte: getStartDateTime(startDate)
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            advValue: {$sum: "$repayAmountPerMonth"}
                        }
                    }
                ]);
                if (employeeAttendance != undefined) {
                    let salaryPayroll = {
                        company: req.user.company,
                        createdBy: req.user.sub,
                        updatedBy: req.user.sub,
                        payrollForMonthYear: date,
                        employeeId: salaryMaster.employeeId,
                        employeeCode: employeeAttendance?.employeeCode,
                        employeeName: employeeAttendance?.employeeName,
                        department: employeeAttendance?.employeeId?.empDepartment,
                        paidDays: +employeeAttendance?.monthDays - +employeeAttendance?.LOPDiff,
                        basic: getSalaryComponentsValue(salaryMaster, employeeAttendance, "Basic"),
                        HRA: getSalaryComponentsValue(salaryMaster, employeeAttendance, "HRA"),
                        CCA: getSalaryComponentsValue(salaryMaster, employeeAttendance, "CCA"),
                        PI: getSalaryComponentsValue(salaryMaster, employeeAttendance, "PI"),
                        Ar: getSalaryComponentsValue(salaryMaster, employeeAttendance, "Ar"),
                        stipend: getSalaryComponentsValue(salaryMaster, employeeAttendance, "Stipend"),
                        TDS: 0,
                        advSalary: advanceSalaryRequest[0]?.advValue ?? 0
                    };
                    salaryPayroll.PF =
                        ((salaryMaster?.isEmployeeProvidentFund ? salaryMaster?.employerPFContributionPerMonth : 0) /
                            +employeeAttendance?.monthDays) *
                        (+employeeAttendance?.monthDays - +employeeAttendance?.LOPDiff);
                    salaryPayroll.gross =
                        salaryPayroll.basic +
                        salaryPayroll.HRA +
                        salaryPayroll.PI +
                        salaryPayroll.CCA +
                        salaryPayroll.Ar +
                        salaryPayroll.stipend;
                    salaryPayroll.PT = await getGenderWisePT(
                        PTArrayStateWise,
                        employeeAttendance.empGender,
                        salaryPayroll.gross,
                        startDate
                    );
                    if (employeeAttendance?.employeeId?.empDesignation?.toLowerCase() == "director") {
                        salaryPayroll.PT = 0;
                    }
                    salaryPayroll.ESIC = salaryPayroll.gross > 21000 ? 0 : salaryPayroll.gross * 0.0075;
                    salaryPayroll.netPayable =
                        salaryPayroll.gross -
                        salaryPayroll.PF -
                        salaryPayroll.ESIC -
                        salaryPayroll.TDS -
                        salaryPayroll.PT -
                        salaryPayroll.advSalary;
                    salaryPayrollOfMonth.push(salaryPayroll);
                }
            }
            // await Model.insertMany(salaryPayrollOfMonth);
            // salaryPayrollOfMonth = await Model.find({
            //   company: req.user.company,
            //   payrollForMonthYear: new Date(startDate),
            // }).sort({ employeeCode: 1 });
        }
        return res.success({salaryPayrollOfMonth});
    } catch (error) {
        console.error("getAllMasterData Payroll", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
exports.getAllReports = async (req, res) => {
    try {
        let {employeeId = null, payrollForMonthYear = null, fromDate = null, toDate = null} = req.query;
        let project = getAllPayrollReportsAttributes();
        let query = {
            company: ObjectId(req.user.company),
            status: OPTIONS.defaultStatus.APPROVED,
            ...(!!employeeId && {
                employeeId: ObjectId(employeeId)
            }),
            ...(!!payrollForMonthYear && {
                payrollForMonthYear: {
                    $eq: new Date(payrollForMonthYear)
                }
            }),
            ...(!!toDate &&
                !!fromDate && {
                    createdAt: {
                        $lte: getEndDateTime(toDate),
                        $gte: getStartDateTime(fromDate)
                    }
                })
        };
        let pipeline = [
            {
                $match: query
            }
        ];
        let rows = await SalaryPayrollRepository.getAllReportsPaginate({
            pipeline,
            project,
            queryParams: req.query,
            groupValues: [
                {
                    $group: {
                        _id: null,
                        gross: {$sum: {$toDouble: "$gross"}},
                        netPayable: {$sum: {$toDouble: "$netPayable"}},
                        PF: {$sum: {$toDouble: "$PF"}},
                        TDS: {$sum: {$toDouble: "$TDS"}}
                    }
                },
                {
                    $project: {
                        gross: {$round: ["$gross", 2]},
                        netPayable: {$round: ["$netPayable", 2]},
                        PF: {$round: ["$PF", 2]},
                        TDS: {$round: ["$TDS", 2]},
                        _id: 0
                    }
                }
            ]
        });
        const employees = await findAllEmployees(req.user.company);
        return res.success({
            employees,
            ...rows
        });
    } catch (error) {
        console.error("Error while fetching  Emp Payroll report ", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
exports.getMonthlyPayrollData = async company => {
    const monthsArray = getFiscalMonthsName();
    const payrollData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const result = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: new Date("$payrollForMonthYear")}}
            }
        },
        {
            $match: {
                company: ObjectId(company),
                matchDate: {
                    $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                    $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                }
            }
        },
        {
            $group: {
                _id: {year_month: {$substrCP: [new Date("$payrollForMonthYear"), 0, 7]}},
                count: {$sum: "$netPayable"}
            }
        },
        {
            $sort: {"_id.year_month": 1}
        },
        {
            $project: {
                _id: 0,
                count: 1,
                month_year: {
                    $concat: [
                        {
                            $arrayElemAt: [
                                monthsArray,
                                {
                                    $subtract: [{$toInt: {$substrCP: ["$_id.year_month", 5, 2]}}, 4]
                                }
                            ]
                        }
                    ]
                }
            }
        },
        {
            $group: {
                _id: null,
                data: {$push: {k: "$month_year", v: "$count"}}
            }
        },
        {
            $project: {
                data: {$arrayToObject: "$data"},
                _id: 0
            }
        }
    ]);
    if (result.length > 0) {
        const propertyNames = Object.keys(result[0].data);
        const propertyValues = Object.values(result[0].data);
        let n = 0;
        propertyNames.forEach(elem => {
            let index = monthsArray.indexOf(elem);
            payrollData[index] = (propertyValues[n] / LAKH).toFixed(2);
            n++;
        });
        let monthlyPayrollData = {months: monthsArray, payrolls: payrollData};
        return monthlyPayrollData;
    } else {
        let monthlyPayrollData = {months: monthsArray, payrolls: []};
        return monthlyPayrollData;
    }
};
exports.getMonthPayrolls = async company => {
    const result = await Model.aggregate([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: new Date("$payrollForMonthYear")}}
            }
        },
        {
            $match: {
                company: ObjectId(company),
                matchDate: getPreviousMonthStartDate(1)
            }
        },
        {
            $group: {
                _id: null,
                count: {$sum: "$netPayable"}
            }
        },
        {
            $project: {
                count: {$round: [{$divide: ["$count", LAKH]}, 2]}
            }
        }
    ]);
    return result[0]?.count || 0;
};
const getSalaryComponentsValue = (salaryMaster, employeeAttendance, title) => {
    let value = 0;
    if (salaryMaster && salaryMaster.salaryComponentDetails.length) {
        let salaryComponentDetails = salaryMaster.salaryComponentDetails.find(
            m => m.salaryComponentId.abbreviation == title
        );
        value = salaryComponentDetails != undefined ? salaryComponentDetails.salaryComponentPerMonth : 0;
        if (value && value != undefined) {
            value =
                (value / +employeeAttendance?.monthDays) *
                (+employeeAttendance?.monthDays - +employeeAttendance?.LOPDiff);
        }
    }

    return value;
};

async function getGenderWisePT(PTEmployees, gender = "Male", grossSalary = 0, startDate) {
    filteredPTEmployees = PTEmployees.filter(x => x.gender == gender);
    for (const employee of filteredPTEmployees) {
        const isSalaryInRange =
            employee.minSalary <= grossSalary && (employee.maxSalary === 0 || grossSalary <= employee.maxSalary);
        const isFebMonth = startDate.getMonth() === 1;
        if (isSalaryInRange) {
            return isFebMonth ? employee.isFebAmount ?? 0 : employee.amount ?? 0;
        }
    }
}

// exports.getAllSalarySlipReports = expressAsyncHandler(async (req, res) => {
//     try {
//         const employeesOptions = await filteredEmployeeList([
//             {$match: {company: ObjectId(req.user.company), empStatus: "A"}},
//             {
//                 $project: {
//                     empFullName: 1
//                 }
//             }
//         ]);
//         const {employee = null, date = null} = req.query;
//         let query = {
//             company: ObjectId(req.user.company),
//             ...(!!employee && {
//                 employeeId: ObjectId(employee)
//             }),
//             payrollForMonthYear: new Date(date)
//         };
//         let project = getAllSalarySlipReportsAttributes();
//         let pipeline = [
//             {
//                 $match: query
//             },
//             {
//                 $lookup: {
//                     from: "Employee",
//                     localField: "employeeId",
//                     foreignField: "_id",
//                     pipeline: [{$project: {empDesignation: 1}}],
//                     as: "employee"
//                 }
//             },
//             {$unwind: "$employee"}
//         ];
//         let rows = await SalaryPayrollRepository.getAllPaginate({
//             pipeline,
//             project,
//             queryParams: req.query
//         });
//         return res.success({
//             employeesOptions,
//             ...rows
//         });
//     } catch (e) {
//         console.error("getAllSalarySlipReports", e);
//         const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
//         return res.serverError(errors);
//     }
// });
