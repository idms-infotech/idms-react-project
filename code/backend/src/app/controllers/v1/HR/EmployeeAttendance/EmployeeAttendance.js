const {db} = require("../../../../../config/mongoose");
const asyncHandler = require("express-async-handler");
const Model = require("../../../../models/HR/employeeAttendanceModel");
const MESSAGES = require("../../../../helpers/messages.options");
const {generateCreateData, OPTIONS} = require("../../../../helpers/global.options");
const {sundaysInMonth} = require("../../../../utilities/utility");
const {getCountOfHolidayOfMonthWithLocations} = require("../PaidHoliday/PaidHoliday");
const {findAllEmployees} = require("../employee/Employee");
const {getAllPaidLeaveOfMonth, getAllAdvanceLeavesOfMonth} = require("../LeavesApplication/LeavesApplication");
const {updatePaidLeaveOnEmpAttendance} = require("../PaidLeaves/PaidLeaves");
const {default: mongoose} = require("mongoose");
const {getMonthODApplicationData} = require("../OnDutyApplication/OnDutyApplication");
const {
    getDaysInCurrentMonth,
    getPreviousMonthStartDate,
    getEndDateTime,
    getStartDateTime
} = require("../../../../helpers/dateTime");
const {getAllEmployeeAttendanceReportsAttributes} = require("../../../../models/HR/helpers/employeeAttendanceHelper");
const EmployeeAttendanceRepository = require("../../../../models/HR/repository/employeeAttendanceRepository");
const ObjectId = mongoose.Types.ObjectId;

exports.create = asyncHandler(async (req, res) => {
    const session = await db.startSession();
    try {
        session.startTransaction();
        for await (const element of req.body) {
            let itemDetails = await EmployeeAttendanceRepository.getDocById(element._id);
            if (element._id && itemDetails) {
                // update
                itemDetails.updatedBy = req.user.sub;
                itemDetails = await generateCreateData(itemDetails, element);
                await itemDetails.save();
                if (itemDetails.LOPDiff < 0) {
                    updatePaidLeaveOnEmpAttendance({
                        employeeId: itemDetails.employeeId,
                        days: Math.abs(itemDetails.LOPDiff),
                        updatedBy: itemDetails.updatedBy
                    });
                }
            } else {
                // create
                delete element._id;
                let createdObj = {
                    company: req.user.company,
                    createdBy: req.user.sub,
                    updatedBy: req.user.sub,
                    ...element
                };
                await EmployeeAttendanceRepository.createDoc(createdObj);
            }
            await session.commitTransaction();
        }
        return res.success({message: "Attendance added successfully !"});
    } catch (e) {
        console.error("create EmployeeAttendance", e);
        await session.abortTransaction();
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
    session.endSession();
});

// @desc    update EmployeeAttendance  Record
exports.update = asyncHandler(async (req, res) => {
    try {
        let itemDetails = await EmployeeAttendanceRepository.getDocById(req.params.id);
        if (!itemDetails) {
            const errors = MESSAGES.apiErrorStrings.INVALID_REQUEST;
            return res.preconditionFailed(errors);
        }
        itemDetails.updatedBy = req.user.sub;
        itemDetails = await EmployeeAttendanceRepository.updateDoc(itemDetails, req.body);
        return res.success({
            message: MESSAGES.apiSuccessStrings.UPDATE("Employee Attendance has been")
        });
    } catch (e) {
        console.error("update EmployeeAttendance", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    deleteById EmployeeAttendance Record
exports.deleteById = asyncHandler(async (req, res) => {
    try {
        const deleteItem = await EmployeeAttendanceRepository.deleteDoc({_id: req.params.id});
        if (deleteItem) {
            return res.success({
                message: MESSAGES.apiSuccessStrings.DELETED("Employee Attendance")
            });
        } else {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Employee Attendance");
            return res.preconditionFailed(errors);
        }
    } catch (e) {
        console.error("deleteById EmployeeAttendance", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getById EmployeeAttendance Record
exports.getById = asyncHandler(async (req, res) => {
    try {
        let existing = await EmployeeAttendanceRepository.getDocById(req.params.id);
        if (!existing) {
            let errors = MESSAGES.apiSuccessStrings.DATA_NOT_EXISTS("Employee Attendance");
            return res.unprocessableEntity(errors);
        }
        return res.success(existing);
    } catch (e) {
        console.error("getById EmployeeAttendance", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

// @desc    getAllMasterData EmployeeAttendance Record
exports.getAllMasterData = asyncHandler(async (req, res) => {
    try {
        let date = req.params.date;
        let startDate = new Date(date);
        let y = startDate.getFullYear();
        let m = startDate.getMonth();
        let endDate = new Date(y, m + 1, 1);
        let attendanceOfMonth = [];
        attendanceOfMonth = await Model.find({
            company: req.user.company,
            attendanceForMonthYear: new Date(startDate)
        });
        if (attendanceOfMonth.length == 0) {
            let noOfDaysInMonth = getDaysInCurrentMonth(startDate);
            let noOfSundaysInMonth = sundaysInMonth(date);
            let paidHolidayCount = await getCountOfHolidayOfMonthWithLocations(startDate, endDate, req.user.company);
            let paidLeaveArr = await getAllPaidLeaveOfMonth(startDate, endDate, req.user.company);
            let advanceLeaveArr = await getAllAdvanceLeavesOfMonth(startDate, endDate, req.user.company);
            let ODLeaveArr = await getMonthODApplicationData(startDate, endDate, req.user.company);
            let employees = await findAllEmployees(req.user.company);
            attendanceOfMonth =
                employees.length &&
                employees.map(x => {
                    let paidLeaves = paidLeaveArr
                        .filter(e => String(e.employeeId) == String(x._id))
                        .map(z => z.leaveDays)
                        .reduce((a, c) => a + c, 0);
                    let advanceLeaves = advanceLeaveArr
                        .filter(e => String(e.employeeId) == String(x._id))
                        .map(z => z.leaveDays)
                        .reduce((a, c) => a + c, 0);
                    let ODDays = ODLeaveArr.filter(e => String(e._id) == String(x._id))
                        .map(z => z.count)
                        .reduce((a, c) => a + c, 0);
                    return {
                        company: req.user.company,
                        createdBy: req.user.sub,
                        updatedBy: req.user.sub,
                        attendanceForMonthYear: date,
                        employeeId: x._id,
                        employeeName: x.empFullName,
                        employeeCode: x.empCode,
                        monthDays: noOfDaysInMonth,
                        weeklyOff: noOfSundaysInMonth,
                        paidHolidays: ["work", "factory"].some(e => x?.empJoiningLocation?.toLowerCase().includes(e))
                            ? +paidHolidayCount.factoryCount + +paidHolidayCount.officeFactoryCount
                            : +paidHolidayCount.officeCount + +paidHolidayCount.officeFactoryCount,
                        paidLeaves: paidLeaves,
                        ODDays: ODDays,
                        presentDays: 0,
                        LOPDiff: advanceLeaves,
                        LATE_HRS: 0,
                        EARLY_HRS: 0,
                        OT_HRS: 0,
                        HRS_WRKD: 0,
                        status: null
                    };
                });
            // await Model.remove({
            //     company: req.user.company,
            //     attendanceForMonthYear: new Date(startDate),
            // });
            await Model.insertMany(attendanceOfMonth);
            attendanceOfMonth = await Model.find({
                company: req.user.company,
                attendanceForMonthYear: new Date(startDate)
            });
        }
        return res.success({attendanceOfMonth});
    } catch (error) {
        console.error("getAllMasterData EmployeeAttendance", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getAllReports = asyncHandler(async (req, res) => {
    try {
        let {employeeId = null, attendanceForMonthYear = null, fromDate = null, toDate = null} = req.query;
        let project = getAllEmployeeAttendanceReportsAttributes();
        let query = {
            company: ObjectId(req.user.company),
            status: {$in: [OPTIONS.defaultStatus.APPROVED]},
            ...(!!employeeId && {
                employeeId: ObjectId(employeeId)
            }),
            ...(!!attendanceForMonthYear && {
                attendanceForMonthYear: {
                    $eq: new Date(attendanceForMonthYear)
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
            },
            {
                $addFields: {
                    createdAtS: {$dateToString: {format: "%d-%m-%Y", date: "$createdAt"}},
                    paidHolidays: {$toString: "$paidHolidays"},
                    adjustedDays: {$toString: "$adjustedDays"},
                    presentDays: {$toString: "$presentDays"},
                    ODDays: {$toString: "$ODDays"},
                    paidLeaves: {$toString: "$paidLeaves"},
                    monthDays: {$toString: "$monthDays"},
                    weeklyOff: {$toString: "$weeklyOff"},
                    LOPDiff: {$toString: "$LOPDiff"}
                }
            }
        ];
        let rows = await EmployeeAttendanceRepository.getAllPaginate({
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
        console.error("Error while fetching  Emp Attendance report ", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.uploadEmployeeAttendance = asyncHandler(async (req, res) => {
    try {
        let date = req.body.date;
        let flag = req.body.flag;
        let attendanceOfMonth = [];
        attendanceOfMonth = await Model.find({
            company: req.user.company,
            attendanceForMonthYear: new Date(new Date(date))
        });
        if (attendanceOfMonth.length == 0) {
            excelUploadFn(req, date, attendanceOfMonth);
        } else {
            if (attendanceOfMonth.every(s => s.status == OPTIONS.defaultStatus.APPROVED)) {
                return res.success({message: "Approved Already exist"});
            }
            if (flag) {
                await Model.remove({
                    company: req.user.company,
                    attendanceForMonthYear: new Date(new Date(date))
                });
                excelUploadFn(req, date, attendanceOfMonth);
            } else {
                return res.success({message: "Already exist"});
            }
        }
        return res.success({message: "Data Integration Successful"});
    } catch (error) {
        console.error("getAllMasterDataForModule", error);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.getLastMonthAttendanceReport = async (company, employeeId) => {
    try {
        let findQuery = {
            company: company,
            status: {$in: [OPTIONS.defaultStatus.APPROVED]},
            employeeId: employeeId,
            attendanceForMonthYear: {
                $eq: new Date(getPreviousMonthStartDate(1))
            }
        };
        let empAttendanceRecords = await EmployeeAttendanceRepository.findOneDoc(findQuery);
        return empAttendanceRecords;
    } catch (error) {
        console.error("Error while fetching  Emp Attendance report ", error);
    }
};
const excelUploadFn = async (req, date, attendanceOfMonth) => {
    let data = req.body.data;
    let startDate = new Date(date);
    let y = startDate.getFullYear();
    let m = startDate.getMonth();
    let endDate = new Date(y, m + 1, 1);
    let noOfDaysInMonth = getDaysInCurrentMonth(startDate);
    let noOfSundaysInMonth = sundaysInMonth(date);
    let paidHolidayCount = await getCountOfHolidayOfMonthWithLocations(startDate, endDate, req.user.company);
    let paidLeaveArr = await getAllPaidLeaveOfMonth(startDate, endDate, req.user.company);
    let advanceLeaveArr = await getAllAdvanceLeavesOfMonth(startDate, endDate, req.user.company);
    let ODLeaveArr = await getMonthODApplicationData(startDate, endDate, req.user.company);
    let employees = await findAllEmployees(req.user.company);
    attendanceOfMonth =
        employees.length &&
        employees.map(x => {
            let paidLeaves = paidLeaveArr
                .filter(e => String(e.employeeId) == String(x._id))
                .map(z => z.leaveDays)
                .reduce((a, c) => a + c, 0);
            let advanceLeaves = advanceLeaveArr
                .filter(e => String(e.employeeId) == String(x._id))
                .map(z => z.leaveDays)
                .reduce((a, c) => a + c, 0);
            let ele = data.find(z => z.empno == x.empCode);
            let ODDays = ODLeaveArr.filter(e => String(e._id) == String(x._id))
                .map(z => z.count)
                .reduce((a, c) => a + c, 0);
            let paidHolidays = ["work", "factory"].some(e => x?.empJoiningLocation?.toLowerCase().includes(e))
                ? +paidHolidayCount.factoryCount + +paidHolidayCount.officeFactoryCount
                : +paidHolidayCount.officeCount + +paidHolidayCount.officeFactoryCount;
            let LOPDiff =
                +noOfDaysInMonth -
                (+noOfSundaysInMonth + +paidHolidays + +paidLeaves + +advanceLeaves + +ODDays + (ele?.PRESENT ?? 0));

            return {
                company: req.user.company,
                createdBy: req.user.sub,
                updatedBy: req.user.sub,
                attendanceForMonthYear: date,
                employeeId: x._id,
                employeeName: x.empFullName,
                employeeCode: x.empCode,
                monthDays: noOfDaysInMonth,
                weeklyOff: noOfSundaysInMonth,
                paidHolidays: paidHolidays,
                paidLeaves: paidLeaves,
                ODDays: ODDays,
                presentDays: ele?.PRESENT ?? 0,
                LATE_HRS: ele?.LATE_HRS ?? 0,
                EARLY_HRS: ele?.EARLY_HRS ?? 0,
                OT_HRS: ele?.OT_HRS ?? 0,
                HRS_WRKD: ele?.HRS_WRKD ?? 0,
                LOPDiff: LOPDiff,
                status: "Draft"
            };
        });
    await Model.insertMany(attendanceOfMonth);
};
