const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/HR/leavesApplicationModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {findAllEmployees} = require("../employee/Employee");
const {
    getFirstDateOfCurrentFiscalYear,
    getLastDateOfCurrentFiscalYear,
    getFiscalMonthsName
} = require("../../../../utilities/utility");
const {paidLeaveByEmpId, updatePaidLeaveOnLeaveApplication} = require("../PaidLeaves/PaidLeaves");
const {default: mongoose} = require("mongoose");
const {
    getEndDateOfMonth,
    dateToAnyFormat,
    getDateDiff,
    getEndDateTime,
    getStartDateTime
} = require("../../../../helpers/dateTime");
const {
    getAllLeaveApplicationAttributes,
    getAllLeaveApplicationReportAttributes
} = require("../../../../models/HR/helpers/leavesApplicationHelper");
// const {getLeaveApplicationMailConfig} = require("./LeavesApplicationMail");
const {getAndSetAutoIncrementNo} = require("../../settings/autoIncrement/autoIncrement");
const {LEAVES_APPLICATION} = require("../../../../mocks/schemasConstant/HRConstant");
const PaidLeaveRepository = require("../../../../models/HR/repository/paidLeaveRepository");
const {filteredEmployeeList} = require("../../../../models/HR/repository/employeeRepository");
const {filteredPaidHolidayList} = require("../../../../models/HR/repository/paidHolidayRepository");
const LeaveApplicationRepository = require("../../../../models/HR/repository/leaveApplicationRepository");
const {HR_ADMIN_MAIL_CONST} = require("../../../../mocks/mailTriggerConstants");
const MailTriggerRepository = require("../../../../models/settings/repository/mailTriggerRepository");
const {findAppParameterValue} = require("../../settings/appParameter/appParameter");
const LeavesApplicationRepository = require("../../../../models/HR/repository/leaveApplicationRepository");
const EmployeeRepository = require("../../../../models/HR/repository/employeeRepository");
const {filteredSubModuleManagementList} = require("../../../../models/settings/repository/subModuleRepository");
const ObjectId = mongoose.Types.ObjectId;

// @route   GET /settings/LeavesApplication/getAll
exports.getAll = async (req, res) => {
    try {
        const {employeeId = null, status = null} = req.query;
        let project = getAllLeaveApplicationAttributes();
        let pipeline = [
            {
                $match: {
                    company: ObjectId(req.user.company),
                    ...(!!status &&
                        status.length > 0 && {
                            status: {$nin: status}
                        }),
                    ...(![undefined, null, ""].includes(employeeId) && {
                        employeeId: ObjectId(employeeId)
                    })
                }
            },
            {
                $addFields: {
                    applicationDateS: {$dateToString: {format: "%d-%m-%Y", date: "$applicationDate"}},
                    resumptionDateS: {$dateToString: {format: "%d-%m-%Y", date: "$resumptionDate"}},
                    fromDateS: {$dateToString: {format: "%d-%m-%Y", date: "$fromDate"}},
                    toDateS: {$dateToString: {format: "%d-%m-%Y", date: "$toDate"}},
                    leaveDays: {$toString: "$leaveDays"}
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
        let leaveSummary = await this.getLeavesCountWithStatusApplicationData(employeeId);
        let rows = await LeaveApplicationRepository.getAllPaginate({pipeline, project, queryParams: req.query});
        return res.success({
            leaveSummary,
            ...rows
        });
    } catch (e) {
        console.error("getAllLeavesApplication", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
// @route   POST /settings/LeavesApplication/create
exports.create = async (req, res) => {
    try {
        let createdObj = {
            company: req.user.company,
            createdBy: req.user.sub,
            updatedBy: req.user.sub,
            ...req.body
        };
        createdObj.monthLeaves = [];
        let diff = new Date(createdObj.toDate).getMonth() - new Date(createdObj.fromDate).getMonth();

        if (diff > 0) {
            let endDate = getEndDateOfMonth(createdObj.fromDate);
            createdObj.monthLeaves = [
                {
                    date: dateToAnyFormat(createdObj.fromDate, "YYYY-MM"),
                    leaveDays: getDateDiff(endDate, createdObj.fromDate, "days")
                },
                {
                    date: dateToAnyFormat(createdObj.toDate, "YYYY-MM"),
                    leaveDays: new Date(dateToAnyFormat(createdObj.toDate, "YYYY-MM-DD")).getDate()
                }
            ];
        } else {
            createdObj.monthLeaves = [
                {
                    date: dateToAnyFormat(createdObj.fromDate, "YYYY-MM"),
                    leaveDays: createdObj.leaveDays
                }
            ];
        }
        const itemDetails = await LeaveApplicationRepository.createDoc(createdObj);
        if (itemDetails.leaveType != "Advance Leaves") {
            await updatePaidLeaveOnLeaveApplication({
                updatedBy: itemDetails.updatedBy,
                employeeId: itemDetails.employeeId,
                leaveType: itemDetails.leaveType,
                leaveDays: itemDetails.leaveDays,
                status: itemDetails.status,
                previousLeaves: 0
            });
        }
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.ADDED("Leaves Application")
            });
            // let mailCreateObj = {
            //     leaveId: itemDetails._id,
            //     action: "created",
            //     company: req.user.company,
            //     mailAction: "Submit"
            // };
            // getLeaveApplicationMailConfig(mailCreateObj);
            let mailTriggerCreateObj = {
                subModuleId: itemDetails._id,
                action: "created",
                company: req.user.company,
                mailAction: "Submit",
                collectionName: LEAVES_APPLICATION.COLLECTION_NAME,
                message: "Attention: Leave application",
                module: HR_ADMIN_MAIL_CONST.LEAVE_APP.MODULE,
                subModule: HR_ADMIN_MAIL_CONST.LEAVE_APP.SUB_MODULE,
                isSent: false
            };
            await MailTriggerRepository.createDoc(mailTriggerCreateObj);
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("create LeavesApplication", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
// @route   PUT /settings/LeavesApplication/update/:id
exports.update = async (req, res) => {
    try {
        let itemDetails = await LeaveApplicationRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        let previousStatus = itemDetails.status;
        let previousLeaves = itemDetails.leaveDays;
        itemDetails = await generateCreateData(itemDetails, req.body);
        itemDetails.monthLeaves = [];
        let diff = new Date(itemDetails.toDate).getMonth() - new Date(itemDetails.fromDate).getMonth();

        if (diff > 0) {
            let endDate = getEndDateOfMonth(itemDetails.fromDate);
            itemDetails.monthLeaves = [
                {
                    date: dateToAnyFormat(itemDetails.fromDate, "YYYY-MM"),
                    leaveDays: getDateDiff(endDate, itemDetails.fromDate, "days")
                },
                {
                    date: dateToAnyFormat(itemDetails.toDate, "YYYY-MM"),
                    leaveDays: new Date(dateToAnyFormat(itemDetails.toDate)).getDate()
                }
            ];
        } else {
            itemDetails.monthLeaves = [
                {
                    date: dateToAnyFormat(itemDetails.fromDate, "YYYY-MM"),
                    leaveDays: itemDetails.leaveDays
                }
            ];
        }
        if (
            previousStatus == OPTIONS.defaultStatus.SUBMITTED &&
            itemDetails.status == OPTIONS.defaultStatus.CANCELLED
        ) {
            itemDetails.status = "Deleted";
        }
        itemDetails = await itemDetails.save();
        if (
            itemDetails.leaveType != "Advance Leaves" &&
            ["Submitted", "Cancelled", "Rejected", "Deleted"].includes(itemDetails.status)
        ) {
            await updatePaidLeaveOnLeaveApplication({
                updatedBy: itemDetails.updatedBy,
                employeeId: itemDetails.employeeId,
                leaveType: itemDetails.leaveType,
                leaveDays: itemDetails.leaveDays,
                status: itemDetails.status,
                previousLeaves: previousLeaves
            });
        }
        if (itemDetails) {
            res.success({
                message: MESSAGES.apiSuccessStrings.UPDATE("Leaves Application")
            });
            // let mailUpdateObj = {
            //     leaveId: itemDetails._id,
            //     action: "modified",
            //     company: req.user.company,
            //     mailAction: itemDetails.status
            // };
            // getLeaveApplicationMailConfig(mailUpdateObj);
            if (!["Submitted"].includes(itemDetails.status)) {
                let mailTriggerCreateObj = {
                    subModuleId: itemDetails._id,
                    action: itemDetails.status,
                    company: req.user.company,
                    mailAction: itemDetails.status == "Deleted" ? OPTIONS.defaultStatus.CANCELLED : itemDetails.status,
                    collectionName: LEAVES_APPLICATION.COLLECTION_NAME,
                    message: "Attention: Leave application",
                    module: HR_ADMIN_MAIL_CONST.LEAVE_APP.MODULE,
                    subModule: HR_ADMIN_MAIL_CONST.LEAVE_APP.SUB_MODULE,
                    isSent: false
                };
                await MailTriggerRepository.createDoc(mailTriggerCreateObj);
            }
        } else {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.serverError(errors);
        }
    } catch (e) {
        console.error("update LeavesApplication", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
// @route   PUT /settings/LeavesApplication/delete/:id
exports.deleteById = async (req, res) => {
    try {
        const deleteItem = await LeaveApplicationRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Leaves Application")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Leaves Application");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById LeavesApplication", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
// @route   GET /settings/LeavesApplication/getById/:id
exports.getById = async (req, res) => {
    try {
        let existing = await LeaveApplicationRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Leaves Application");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById Leaves Application", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
// @route   GET /settings/LeavesApplication/getPaidLeaveByEmpId/:id
exports.getPaidLeaveByEmpId = async (req, res) => {
    try {
        let existing = await paidLeaveByEmpId(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Leaves Application");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById LeavesApplication", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

// @route   GET /settings/LeavesApplication/getAllMasterData
exports.getAllMasterData = async (req, res) => {
    try {
        const autoIncrementNo = await getAndSetAutoIncrementNo(
            LEAVES_APPLICATION.AUTO_INCREMENT_DATA(),
            req.user.company
        );
        const employeesOptions = await filteredEmployeeList([
            {$match: {company: ObjectId(req.user.company), empStatus: "A"}},
            {$sort: {createdAt: 1}},
            {
                $project: {
                    label: {$concat: ["$empCode", "-", "$empFullName"]},
                    value: "$_id",
                    joiningLocation: "$empJoiningLocation",
                    empFullName: 1
                }
            }
        ]);
        const allHolidaysOptions = await filteredPaidHolidayList([
            {$match: {company: ObjectId(req.user.company)}},
            {$sort: {createdAt: -1}},
            {
                $project: {
                    _id: 1,
                    serialNumber: 1,
                    holidayName: 1,
                    holidayDate: 1,
                    holidayDay: 1,
                    holidayLocation: 1
                }
            }
        ]);

        const featureConfig = await filteredSubModuleManagementList([
            {
                $match: {
                    _id: ObjectId(req.query.subModuleId)
                }
            },
            {
                $unwind: "$featureConfig"
            },
            {
                $match: {
                    "featureConfig.status": true
                }
            },
            {
                $project: {
                    featureCode: "$featureConfig.featureCode",
                    value: "$featureConfig.value"
                }
            }
        ]);

        return res.success({
            autoIncrementNo,
            employeesOptions,
            allHolidaysOptions,
            featureConfig
        });
    } catch (error) {
        console.error("getAllMasterData LeavesApplication", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
exports.getAllPaidLeaveOfMonth = async (startDate, endDate, company) => {
    try {
        let paidLeaveOfMonth = await Model.find(
            {
                $and: [
                    {company: ObjectId(company)},
                    {status: {$in: ["Approved", "Availed"]}},
                    {leaveType: {$in: ["Paid Leaves", "Compensatory Off"]}},
                    {
                        $or: [
                            {
                                fromDate: {
                                    $lte: getEndDateTime(endDate),
                                    $gte: getStartDateTime(startDate)
                                }
                            },
                            {
                                toDate: {
                                    $lte: getEndDateTime(endDate),
                                    $gte: getStartDateTime(startDate)
                                }
                            }
                        ]
                    }
                ]
            },
            {
                employeeId: 1,
                fromDate: 1,
                toDate: 1,
                leaveDays: 1
            }
        );
        paidLeaveOfMonth = paidLeaveOfMonth.map(x => {
            let leaveDays = 0;
            let diff = getDateDiff(x.toDate, x.fromDate, "months") - 1;
            if (diff > 0) {
                if (new Date(startDate).getMonth() == new Date(x.fromDate).getMonth()) {
                    let dayDiff = getDateDiff(endDate, x.fromDate, "days");
                    leaveDays = dayDiff;
                } else {
                    leaveDays = new Date(x.toDate).getDate();
                }
            } else {
                leaveDays = x.leaveDays;
            }
            return {
                employeeId: x.employeeId,
                leaveDays: leaveDays
            };
        });
        return paidLeaveOfMonth;
    } catch (error) {
        console.error("getPaidLeaveByEmpId", error);
        throw new Error("Error in get Record");
    }
};
exports.getAllAdvanceLeavesOfMonth = async (startDate, endDate, company) => {
    try {
        let advanceLeaveOfMonth = await Model.find(
            {
                $and: [
                    {company: ObjectId(company)},
                    {status: {$in: ["Approved", "Availed"]}},
                    {leaveType: {$in: ["Advance Leaves"]}},
                    {
                        $or: [
                            {
                                fromDate: {
                                    $lte: getEndDateTime(endDate),
                                    $gte: getStartDateTime(startDate)
                                }
                            },
                            {
                                toDate: {
                                    $lte: getEndDateTime(endDate),
                                    $gte: getStartDateTime(startDate)
                                }
                            }
                        ]
                    }
                ]
            },
            {
                employeeId: 1,
                fromDate: 1,
                toDate: 1,
                leaveDays: 1
            }
        );
        advanceLeaveOfMonth = advanceLeaveOfMonth.map(x => {
            let leaveDays = 0;
            let diff = getDateDiff(x.toDate, x.fromDate, "months") - 1;
            if (diff > 0) {
                if (new Date(startDate).getMonth() == new Date(x.fromDate).getMonth()) {
                    let dayDiff = getDateDiff(endDate, x.fromDate, "days");
                    leaveDays = dayDiff;
                } else {
                    leaveDays = new Date(x.toDate).getDate();
                }
            } else {
                leaveDays = x.leaveDays;
            }
            return {
                employeeId: x.employeeId,
                leaveDays: leaveDays
            };
        });
        return advanceLeaveOfMonth;
    } catch (error) {
        console.error("getAdvanceLeaveByEmpId", error);
        throw new Error("Error in get Record");
    }
};
exports.getAllReports = async (req, res) => {
    try {
        const {employeeId = null, fromDate = null, toDate = null} = req.query;
        let project = getAllLeaveApplicationReportAttributes();
        let query = {
            status: {$in: ["Approved", "Availed"]},
            ...(!!employeeId && {
                employeeId: ObjectId(employeeId)
            }),
            ...(!!fromDate &&
                !!toDate && {
                    $or: [
                        {
                            fromDate: {
                                $lte: getEndDateTime(toDate),
                                $gte: getStartDateTime(fromDate)
                            }
                        },
                        {
                            toDate: {
                                $lte: getEndDateTime(toDate),
                                $gte: getStartDateTime(fromDate)
                            }
                        }
                    ]
                })
        };
        let pipeline = [
            {
                $match: query
            },
            {
                $addFields: {
                    applicationDateS: {$dateToString: {format: "%d-%m-%Y", date: "$applicationDate"}},
                    resumptionDateS: {$dateToString: {format: "%d-%m-%Y", date: "$resumptionDate"}},
                    fromDateS: {$dateToString: {format: "%d-%m-%Y", date: "$fromDate"}},
                    toDateS: {$dateToString: {format: "%d-%m-%Y", date: "$toDate"}},
                    leaveDays: {$toString: "$leaveDays"}
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
            {$unwind: "$employeeId"},
            {
                $lookup: {
                    from: "User",
                    localField: "updatedBy",
                    foreignField: "_id",
                    pipeline: [{$project: {name: 1}}],
                    as: "updatedBy"
                }
            },
            {
                $unwind: "$updatedBy"
            }
        ];
        let rows = await LeaveApplicationRepository.getAllPaginate({
            pipeline,
            project,
            queryParams: req.query
        });
        const employees = await findAllEmployees(req.user.company);
        return res.success({
            employees,
            ...rows
        });
    } catch (error) {
        console.error("Error while fetching  leave Application report ", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};
exports.getMonthlyLeaveApplicationData = async company => {
    const monthsArray = getFiscalMonthsName();
    const leavesData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const result = await LeaveApplicationRepository.filteredLeaveAppList([
        {
            $addFields: {
                matchFromDate: {$dateToString: {format: "%Y-%m-%d", date: "$fromDate"}},
                matchToDate: {$dateToString: {format: "%Y-%m-%d", date: "$toDate"}}
            }
        },
        {
            $match: {
                $and: [
                    {company: ObjectId(company)},
                    {status: "Approved"},
                    {
                        $or: [
                            {
                                matchFromDate: {
                                    $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                                    $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                                }
                            },
                            {
                                matchToDate: {
                                    $gte: dateToAnyFormat(getFirstDateOfCurrentFiscalYear(), "YYYY-MM-DD"),
                                    $lte: dateToAnyFormat(getLastDateOfCurrentFiscalYear(), "YYYY-MM-DD")
                                }
                            }
                        ]
                    }
                ]
            }
        },
        {
            $project: {
                monthLeaves: 1,
                _id: 0
            }
        },
        {
            $unwind: "$monthLeaves"
        },
        {
            $group: {
                _id: {year_month: {$substrCP: ["$monthLeaves.date", 0, 7]}},
                count: {$sum: "$monthLeaves.leaveDays"}
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
            leavesData[index] = propertyValues[n];
            n++;
        });
        let monthlyLAData = {
            months: monthsArray,
            leaveApplications: leavesData
        };
        return monthlyLAData;
    } else {
        let monthlyLAData = {months: monthsArray, leaveApplications: []};
        return monthlyLAData;
    }
};
exports.getMonthLeaveApplicationData = async (startDate, endDate, company) => {
    const result = await LeaveApplicationRepository.filteredLeaveAppList([
        {
            $project: {
                monthLeaves: 1,
                company: 1,
                status: 1,
                _id: 0
            }
        },
        {
            $unwind: "$monthLeaves"
        },
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$monthLeaves.date"}}
            }
        },
        {
            $match: {
                company: ObjectId(company),
                status: "Approved",
                matchDate: startDate
            }
        },
        {
            $group: {
                _id: "$monthLeaves.date",
                leaveDays: {$sum: "$monthLeaves.leaveDays"}
            }
        },
        {
            $project: {
                _id: 1,
                leaveDays: 1
            }
        }
    ]);
    return result[0]?.leaveDays || 0;
};
exports.updateLeaveApplicationStatusToAvailed = async () => {
    try {
        let date = new Date();
        await Model.updateMany(
            {
                status: "Approved",
                fromDate: {
                    $lt: date
                }
            },
            {
                $set: {
                    status: "Availed"
                }
            },
            {new: true, useFindAndModify: false}
        );
    } catch (error) {
        console.error("updateLeaveApplicationStatusToAvailed", error);
    }
};
exports.approvedLeaveApplicationOfEmployeesCount = async employeeId => {
    try {
        const findQuery = {
            empStatus: {$in: ["A", "Active"]},
            ...(![undefined, null, ""].includes(employeeId) && {
                empReportTo: mongoose.Types.ObjectId(employeeId)
            })
        };
        let leaveApplications = await EmployeeRepository.filteredEmployeeList([
            {$match: findQuery},
            {
                $lookup: {
                    from: "LeavesApplication",
                    localField: "_id",
                    foreignField: "employeeId",
                    as: "leavesApplications"
                }
            },
            {
                $project: {
                    _id: 0,
                    empCode: 1,
                    empFullName: 1,
                    leavesApplications: 1
                }
            },
            {
                $match: {
                    leavesApplications: {$exists: true, $type: "array", $ne: []}
                }
            },
            {
                $unwind: "$leavesApplications"
            },
            {
                $match: {
                    "leavesApplications.status": OPTIONS.defaultStatus.SUBMITTED
                }
            },
            {
                $addFields: {
                    _id: "$leavesApplications._id"
                }
            },
            {$group: {_id: null, count: {$sum: 1}}},
            {$project: {_id: 0}}
        ]);

        return leaveApplications[0]?.count || 0;
    } catch (error) {
        res.status(400);
        throw new Error("Invalid Model data");
    }
};
exports.getLeavesCountWithStatusApplicationData = async (employeeId = null) => {
    const result = await Model.aggregate([
        {
            $match: {
                employeeId: mongoose.Types.ObjectId(employeeId)
            }
        },
        {
            $project: {
                leaveDays: 1,
                status: 1,
                leaveType: 1,
                _id: 0
            }
        },
        {
            $unwind: "$leaveDays"
        },
        {
            $group: {
                _id: {leaveType: "$leaveType", status: "$status"},
                leaveDays: {$sum: "$leaveDays"}
            }
        },
        {
            $group: {
                _id: null,
                data: {
                    $push: {
                        leaveType: "$_id.leaveType",
                        status: "$_id.status",
                        leaveDays: "$leaveDays"
                    }
                }
            }
        },
        {
            $project: {
                data: 1,
                _id: 0
            }
        }
    ]);
    return result[0]?.data ?? [];
};
exports.approvedLeaveApplicationOfEmployees = async (req, res) => {
    try {
        const {employeeId = null, status = [OPTIONS.defaultStatus.SUBMITTED]} = req.query;
        const findQuery = {
            empStatus: {$in: ["A"]},
            ...(![undefined, null, ""].includes(employeeId) && {
                empReportTo: mongoose.Types.ObjectId(employeeId)
            })
        };
        let leaveApplications = await EmployeeRepository.filteredEmployeeList([
            {$match: findQuery},
            {
                $lookup: {
                    from: "LeavesApplication",
                    localField: "_id",
                    foreignField: "employeeId",
                    as: "leavesApplications"
                }
            },
            {
                $project: {
                    _id: 0,
                    empCode: 1,
                    empFullName: 1,
                    leavesApplications: 1
                }
            },
            {
                $match: {
                    leavesApplications: {$exists: true, $type: "array", $ne: []}
                }
            },
            {
                $unwind: "$leavesApplications"
            },
            {
                $match: {
                    "leavesApplications.status": {$in: status}
                }
            },
            {
                $sort: {"leavesApplications.resumptionDate": -1}
            },
            {
                $addFields: {
                    _id: "$leavesApplications._id",
                    status: "$leavesApplications.status",
                    leavesApplicationNumber: "$leavesApplications.leavesApplicationNumber",
                    applicationDate: "$leavesApplications.applicationDate",
                    employeeId: "$leavesApplications.employeeId",
                    leaveType: "$leavesApplications.leaveType",
                    fromDate: "$leavesApplications.fromDate",
                    toDate: "$leavesApplications.toDate",
                    halfDay: "$leavesApplications.halfDay",
                    leaveDays: "$leavesApplications.leaveDays",
                    resumptionDate: "$leavesApplications.resumptionDate",
                    reasonForLeave: "$leavesApplications.reasonForLeave",
                    fromSession: "$leavesApplications.fromSession",
                    toSession: "$leavesApplications.toSession"
                }
            },
            {
                $project: {
                    leavesApplications: 0
                }
            }
        ]);

        return res.success({
            rows: leaveApplications
            // count: rows[0].metadata ? (rows[0].metadata.length ? rows[0].metadata[0].total : 0) : 0,
        });
    } catch (error) {
        console.error("getAll", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.updateOnLeaveAdjustment = async (req, res) => {
    try {
        let itemDetails = await LeaveApplicationRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        let previousLeaves = itemDetails.leaveDays;
        itemDetails = await generateCreateData(itemDetails, req.body);
        itemDetails.monthLeaves = [];
        let diff = new Date(itemDetails.toDate).getMonth() - new Date(itemDetails.fromDate).getMonth();
        if (diff > 0) {
            let endDate = getEndDateOfMonth(itemDetails.fromDate);
            itemDetails.monthLeaves = [
                {
                    date: dateToAnyFormat(itemDetails.fromDate, "YYYY-MM"),
                    leaveDays: getDateDiff(endDate, itemDetails.fromDate, "days")
                },
                {
                    date: dateToAnyFormat(itemDetails.toDate, "YYYY-MM"),
                    leaveDays: new Date(dateToAnyFormat(itemDetails.toDate)).getDate()
                }
            ];
        } else {
            itemDetails.monthLeaves = [
                {
                    date: dateToAnyFormat(itemDetails.fromDate, "YYYY-MM"),
                    leaveDays: itemDetails.leaveDays
                }
            ];
        }
        itemDetails.status = "Adjusted";
        itemDetails = await itemDetails.save();

        return res.success({
            message: `Leaves Application has been ${
                itemDetails.status == OPTIONS.defaultStatus.SUBMITTED ? "updated" : itemDetails.status.toLowerCase()
            } successfully`
        });
    } catch (e) {
        console.error("update LeavesApplication", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
};

exports.getTotalNoOfEmployeesOnLeavePerDay = async company => {
    const currentDate = dateToAnyFormat(new Date(), "YYYY-MM-DD");
    const rows = await LeavesApplicationRepository.filteredLeaveAppList([
        {
            $addFields: {
                matchDate: {$dateToString: {format: "%Y-%m-%d", date: "$applicationDate"}}
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
                count: {$sum: {$cond: [{$eq: ["$status", "Submitted"]}, 1, 0]}}
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

exports.updateOnCancel = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await LeaveApplicationRepository.getDocById(_id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        let updatedObj = await LeaveApplicationRepository.updateDoc(itemDetails, req.body);
        let casualLeaveCL = 0;
        let privilegeLeavePL = 0;
        let sickLeaveSL = 0;
        let employeeId = itemDetails.employeeId;
        if (updatedObj) {
            if (itemDetails.leaveType == "Paid Leaves") {
                casualLeaveCL = itemDetails.leaveDays;
            }
            if (itemDetails.leaveType == "Compensatory Off") {
                privilegeLeavePL = itemDetails.leaveDays;
            }
            if (itemDetails.leaveType == "Advance Leaves") {
                sickLeaveSL = itemDetails.leaveDays;
            }
            let paidLeaves = await PaidLeaveRepository.findOneDoc({employeeId: employeeId});
            if (!itemDetails) {
                const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
                return res.preconditionFailed(errors);
            }
            paidLeaves.casualLeaveCL = paidLeaves.casualLeaveCL + casualLeaveCL;
            paidLeaves.privilegeLeavePL = paidLeaves.privilegeLeavePL + privilegeLeavePL;
            paidLeaves.sickLeaveSL = paidLeaves.sickLeaveSL + sickLeaveSL;
            await paidLeaves.save();
        }
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Leave Application has been")
        });
    } catch (e) {
        console.error("update Leave Application ", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
