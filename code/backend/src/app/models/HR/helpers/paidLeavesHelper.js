exports.getAllPaidLeavesAttributes = () => {
    return {
        company: 1,
        employeeId: "$employeeId._id",
        empFullName: "$employeeId.empFullName",
        empCode: "$employeeId.empCode",
        dateOfJoining: 1,
        dateOfJoiningS: 1,
        calendarYear: 1,
        casualLeaveCL: 1,
        sickLeaveSL: 1,
        privilegeLeavePL: 1,
        totalSickLeaveSL: 1,
        totalPrivilegeLeavePL: 1,
        totalPrivilegeLeavePL: 1,
        createdAt: 1
    };
};
