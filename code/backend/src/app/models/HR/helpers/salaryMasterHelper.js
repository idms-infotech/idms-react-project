exports.getAllSalaryMasterAttributes = () => {
    return {
        company: 1,
        employeeId: "$employeeId._id",
        empCode: "$employeeId.empCode",
        empFullName: "$employeeId.empFullName",
        empDepartment: "$employeeId.empDepartment",
        PFWagesForContribution: 1,
        employerPFContributionPerMonth: 1,
        costTOCompanyCTCPerMonth: 1,
        gratuityPerMonth: 1,
        Basic: 1,
        HRA: 1,
        CCA: 1,
        PA: 1,
        grossSalaryPerMonth: 1,
        effectFromDate: 1,
        salaryComponentDetails: 1,
        effectFromDateS: 1,
        isOld: 1,
        createdAt: 1
    };
};
