const {getFirstDateOfMonth, getLastDateOfMonth} = require("../../../../utilities/utility");
const {getUpComingHolidays, getCountOfHolidayOfMonth} = require("../../HR/PaidHoliday/PaidHoliday");
const {getLastMonthAttendanceReport} = require("../../HR/EmployeeAttendance/EmployeeAttendance");
const {onDutyApplicationOfEmployeesCount} = require("../../HR/OnDutyApplication/OnDutyApplication");
const {
    approvedLeaveApplicationOfEmployeesCount,
    getMonthLeaveApplicationData
} = require("../../HR/LeavesApplication/LeavesApplication");
const {getLeaveByEmployeeId, getBalanceLeaveByEmployeeId} = require("../../HR/PaidLeaves/PaidLeaves");
const {getEmployeeById} = require("../../HR/employee/Employee");
const memoryCacheHandler = require("../../../../utilities/memoryCacheHandler");
exports.employeePortal = async (company, employeeId) => {
    try {
        let startDate = getFirstDateOfMonth();
        let endDate = getLastDateOfMonth();
        const [
            getUpComingHoliday,
            paidHolidayCount,
            getLastMonthAttendance,
            AODACount,
            ALACount,
            leaves,
            balanceLeave,
            availedLeaves,
            employee
        ] = await Promise.all([
            getUpComingHolidays(company),
            getCountOfHolidayOfMonth(startDate, endDate, company),
            getLastMonthAttendanceReport(company, employeeId),
            onDutyApplicationOfEmployeesCount(employeeId),
            approvedLeaveApplicationOfEmployeesCount(employeeId),
            getLeaveByEmployeeId(employeeId),
            getBalanceLeaveByEmployeeId(employeeId),
            getMonthLeaveApplicationData(startDate, endDate, company, employeeId),
            getEmployeeById(employeeId)
        ]);

        let output = {
            paidHolidayCount,
            availedLeaves,
            balanceLeave,
            getUpComingHoliday,
            getLastMonthAttendance,
            leaves,
            employee,
            ALACount,
            AODACount
        };
        memoryCacheHandler.put("employeePortal", output);
        return output;
    } catch (error) {
        console.error(error);
    }
};
