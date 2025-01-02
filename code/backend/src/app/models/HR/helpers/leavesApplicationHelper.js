exports.getAllLeaveApplicationAttributes = () => {
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
        leaveType: 1,
        leaveDays: 1,
        resumptionDate: 1,
        resumptionDateS: 1,
        reasonForLeave: 1,
        cancelReason: 1,
        status: 1,
        createdAt: 1
    };
};
exports.getAllLeaveApplicationReportAttributes = () => {
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
        leaveType: 1,
        leaveDays: 1,
        resumptionDate: 1,
        resumptionDateS: 1,
        createdAt: 1,
        updatedAt: {$dateToString: {format: "%d-%m-%Y", date: "$updatedAt"}},
        approvedBy: "$updatedBy.name",
        status: 1
    };
};
