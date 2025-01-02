exports.getAllPayrollReportsAttributes = () => {
    return {
        company: 1,
        payrollForMonthYear: 1,
        employeeId: 1,
        employeeCode: 1,
        employeeName: 1,
        department: 1,
        paidDays: {$toString: "$paidDays"},
        /*    basic: 1,
        HRA: 1,
        CCA: 1,
        PI: 1,
        Ar: 1,
        stipend: 1, */
        gross: "$gross",
        PF: "$PF",
        ESIC: {$toString: "$ESIC"},
        PT: {$toString: "$PT"},
        TDS: "$TDS",
        advSalary: "$advSalary",
        netPayable: "$netPayable",
        status: 1,
        createdAtS: {$dateToString: {format: "%d-%m-%Y", date: "$createdAt"}},
        createdAt: 1
    };
};
exports.getAllSalarySlipReportsAttributes = () => {
    return {
        employeeCode: 1,
        employeeName: 1,
        empDesignation: "$employee.empDesignation",
        gross,
        netPayable,
        deduction: {$sum: ["$PF", "$ESIC", "$TDS", "$PT", "$advSalary"]}
    };
};
