exports.ADVANCE_SALARY_REQUEST = {
    COLLECTION_NAME: "AdvanceSalaryRequest",
    ADDED_ACTION: "Advance Salary Request created",
    UPDATED_ACTION: "Advance Salary Request updated",
    MODULE_NAME: "Advance Salary Request",
    MODULE: "SAR",
    MODULE_PREFIX: "SAR/",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.EMPLOYEE_LEAVE = {
    COLLECTION_NAME: "EmpLeave",
    // ADDED_ACTION: "Advance Salary Request created",
    // UPDATED_ACTION: "Advance Salary Request updated",
    // MODULE_NAME: "Advance Salary Request",
    MODULE: "EmpLeave"
    // MODULE_PREFIX: "SAR",
    // AUTO_INCREMENT_DATA: function () {
    //     return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    // }
};
exports.EMPLOYEE_ATTENDANCE = {
    COLLECTION_NAME: "EmployeeAttendance",
    ADDED_ACTION: "Employee Attendance created",
    UPDATED_ACTION: "Employee Attendance updated",
    // MODULE_NAME: "Advance Salary Request",
    MODULE: "EmployeeAttendance"
    // MODULE_PREFIX: "SAR",
    // AUTO_INCREMENT_DATA: function () {
    //     return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    // }
};
exports.EMPLOYEE = {
    COLLECTION_NAME: "Employee",
    ADDED_ACTION: "Employee created",
    UPDATED_ACTION: "Employee updated",
    MODULE_NAME: "Employee",
    MODULE: "EMP",
    MODULE_PREFIX: "E",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.LEAVES_APPLICATION = {
    COLLECTION_NAME: "LeavesApplication",
    ADDED_ACTION: "Leave Application created",
    UPDATED_ACTION: "Leave Application updated",
    MODULE_NAME: "Leaves Application",
    MODULE: "LA",
    MODULE_PREFIX: "LA",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.ON_DUTY_APPLICATION = {
    COLLECTION_NAME: "OnDutyApplication",
    ADDED_ACTION: "On Duty Application created",
    UPDATED_ACTION: "On Duty Application updated",
    MODULE_NAME: "On Duty Application",
    MODULE: "ODA",
    MODULE_PREFIX: "ODA",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.PAID_HOLIDAY = {
    COLLECTION_NAME: "PaidHoliday",
    ADDED_ACTION: "Paid Holiday created",
    UPDATED_ACTION: "Paid Holiday updated"
    // MODULE_NAME: "On Duty Application",
    // MODULE: "ODA",
    // MODULE_PREFIX: "ODA",
    // AUTO_INCREMENT_DATA: function () {
    //     return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    // }
};
exports.PAID_LEAVES = {
    COLLECTION_NAME: "PaidLeaves",
    ADDED_ACTION: "Paid Leaves created",
    UPDATED_ACTION: "Paid Leaves updated",
    MODULE_NAME: "Paid Leaves",
    MODULE: "PL",
    MODULE_PREFIX: "PL",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.SALARY_COMPONENTS = {
    COLLECTION_NAME: "SalaryComponent",
    ADDED_ACTION: "Salary Component created",
    UPDATED_ACTION: "Salary Component updated",
    MODULE_NAME: "Salary Component",
    MODULE: "SC",
    MODULE_PREFIX: "SC",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.SALARY_MASTER = {
    COLLECTION_NAME: "SalaryMaster",
    ADDED_ACTION: "Salary Master created",
    UPDATED_ACTION: "Salary Master updated",
    MODULE_NAME: "Salary Master",
    MODULE: "SM",
    MODULE_PREFIX: "S",
    AUTO_INCREMENT_DATA: function () {
        return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    }
};
exports.SALARY_PAYROLL = {
    COLLECTION_NAME: "SalaryPayroll",
    ADDED_ACTION: "Salary Payroll created",
    UPDATED_ACTION: "Salary Payroll updated"
    // MODULE_NAME: "Salary Master",
    // MODULE: "SM",
    // MODULE_PREFIX: "SM",
    // AUTO_INCREMENT_DATA: function () {
    //     return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
    // }
};
exports.STATUTORY_CONTRIBUTION = {
    COLLECTION_NAME: "StatutoryContributionsSetup",
    ADDED_ACTION: "Statutory Contributions Setup created",
    UPDATED_ACTION: "Statutory Contributions Setup updated"
    // MODULE_NAME: "Salary Master",
    // MODULE: "SM",
    // MODULE_PREFIX: "SM",
    // AUTO_INCREMENT_DATA: function () {
    //     return {moduleName: this.MODULE_NAME, module: this.MODULE, company: null, modulePrefix: this.MODULE_PREFIX};
};
