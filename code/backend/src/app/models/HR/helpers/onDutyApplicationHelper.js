exports.getAllOnDutyApplicationAttributes = () => {
    return {
        company: 1,
        applicationDate: 1,
        applicationDateS: 1,
        employeeId: "$employeeId._id",
        empFullName: "$employeeId.empFullName",
        empCode: "$employeeId.empCode",
        fromDate: 1,
        fromDateS: 1,
        toDate: 1,
        toDateS: 1,
        fromSession: 1,
        toSession: 1,
        ODType: 1,
        ODDays: 1,
        resumptionDate: 1,
        resumptionDateS: 1,
        status: 1,
        reason: 1,
        createdAt: 1
    };
};

exports.getAllOnDutyApplicationReportsAttributes = () => {
    return {
        company: 1,
        applicationDate: 1,
        applicationDateS: 1,
        employeeId: "$employeeId._id",
        empFullName: "$employeeId.empFullName",
        empCode: "$employeeId.empCode",
        fromDate: 1,
        fromDateS: 1,
        toDate: 1,
        toDateS: 1,
        fromSession: 1,
        toSession: 1,
        ODType: 1,
        ODDays: 1,
        resumptionDate: 1,
        resumptionDateS: 1,
        createdAt: 1,
        status: 1,
        reason: 1
    };
};
