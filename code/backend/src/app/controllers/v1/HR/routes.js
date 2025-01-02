const router = require("express").Router();
const AdvanceSalaryRequest = require("./AdvanceSalaryRequest/routes");
const employee = require("./employee/routes");
const EmployeeAttendance = require("./EmployeeAttendance/routes");
const LeavesApplication = require("./LeavesApplication/routes");
const OnDutyApplication = require("./OnDutyApplication/routes");
const PaidHoliday = require("./PaidHoliday/routes");
const PaidLeaves = require("./PaidLeaves/routes");
const Payroll = require("./Payroll/routes");
const SalaryComponent = require("./SalaryComponent/routes");
const SalaryMaster = require("./SalaryMaster/routes");
const StatutoryContributionsSetup = require("./StatutoryContributionsSetup/routes");

router.use("/advanceSalaryRequest", AdvanceSalaryRequest);
router.use("/employee", employee);
router.use("/employeeAttendance", EmployeeAttendance);
router.use("/leavesApplication", LeavesApplication);
router.use("/onDutyApplication", OnDutyApplication);
router.use("/paidHoliday", PaidHoliday);
router.use("/paidLeaves", PaidLeaves);
router.use("/payroll", Payroll);
router.use("/salaryComponent", SalaryComponent);
router.use("/salaryMaster", SalaryMaster);
router.use("/statutoryContributionsSetup", StatutoryContributionsSetup);

module.exports = router;
