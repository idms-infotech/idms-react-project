exports.getAllAdvanceSalaryAttributes = () => {
    return {
        company: 1,
        requestDate: 1,
        employeeCode: 1,
        employeeId: "$employeeId._id",
        empFullName: "$employeeId.empFullName",
        amount: 1,
        repayStartMonthYear: 1,
        repayEndMonthYear: 1,
        tenureMonths: 1,
        repayAmountPerMonth: 1,
        reasonForAdvance: 1,
        status: 1,
        requestDateS: 1,
        repayEndMonthYearS: 1,
        repayStartMonthYearS: 1,
        createdAt: 1
    };
};
