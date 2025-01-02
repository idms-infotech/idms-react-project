const {getFirstDateOfMonth, getLastDateOfMonth} = require("../../../../utilities/utility");
const {getEmployeeCounts, getTotalNoOfEmployeesPerDay} = require("../../HR/employee/Employee");
const {getCountOfHolidayOfMonth} = require("../../HR/PaidHoliday/PaidHoliday");
const {
    getMonthLeaveApplicationData,
    getMonthlyLeaveApplicationData,
    getTotalNoOfEmployeesOnLeavePerDay
} = require("../../HR/LeavesApplication/LeavesApplication");
const {getMonthPayrolls, getMonthlyPayrollData} = require("../../HR/Payroll/Payroll");
const {getTotalNoOfEmployeesOnODPerDay} = require("../../HR/OnDutyApplication/OnDutyApplication");
const memoryCacheHandler = require("../../../../utilities/memoryCacheHandler");
const {dateToAnyFormat} = require("../../../../helpers/dateTime");

exports.HR = async company => {
    try {
        let startDate = dateToAnyFormat(getFirstDateOfMonth(), "YYYY-MM-DD");
        let endDate = dateToAnyFormat(getLastDateOfMonth(), "YYYY-MM-DD");
        const [
            employeesCount,
            paidHolidayCount,
            paidLeaveCount,
            monthPayrolls,
            monthlyPayrollData,
            monthlyLeaveApplicationData,
            totalNoOfEmployeesPerDay,
            totalNoOfEmployeesOnODPerDay,
            totalNoOfEmployeesOnLeavePerDay
        ] = await Promise.all([
            getEmployeeCounts(company),
            getCountOfHolidayOfMonth(startDate, endDate, company),
            getMonthLeaveApplicationData(startDate, endDate, company),
            getMonthPayrolls(company),
            getMonthlyPayrollData(company),
            getMonthlyLeaveApplicationData(company),
            getTotalNoOfEmployeesPerDay(company),
            getTotalNoOfEmployeesOnODPerDay(company),
            getTotalNoOfEmployeesOnLeavePerDay(company)
        ]);

        let output = {
            barChartDataPayroll: {
                labels: monthlyPayrollData?.months || [],
                datasets: [{data: monthlyPayrollData?.payrolls || []}]
            },
            barChartDataLeaves: {
                labels: monthlyLeaveApplicationData?.months || [],
                datasets: [{data: monthlyLeaveApplicationData?.leaveApplications || []}]
            },
            monthPayrolls: monthPayrolls || 0,
            paidHolidayCount: paidHolidayCount || 0,
            paidLeaveCount: paidLeaveCount || 0,
            maleEmployees: employeesCount?.maleEmployees || 0,
            femaleEmployees: employeesCount?.femaleEmployees || 0,
            activeEmployees: employeesCount?.activeEmployees || 0,
            totalNoOfEmployeesPerDay: totalNoOfEmployeesPerDay || 0,
            totalNoOfEmployeesOnODPerDay: totalNoOfEmployeesOnODPerDay || 0,
            totalNoOfEmployeesOnLeavePerDay: totalNoOfEmployeesOnLeavePerDay || 0,
            unit: "Lakh"
        };
        memoryCacheHandler.put("HR", {});
        memoryCacheHandler.put("HR", output);
        return output;
    } catch (e) {
        console.error(e);
    }
};
