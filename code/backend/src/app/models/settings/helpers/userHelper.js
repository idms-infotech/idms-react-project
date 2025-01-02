exports.getAllUserAttributes = () => {
    return {
        company: 1,
        userCode: 1,
        userId: 1,
        name: 1,
        email: 1,
        userType: 1,
        departmentName: 1,
        // roleCode: "$role.roleCode",
        roleName: "$role.roleName",
        isActive: 1
    };
};
exports.getAllUserReportsAttributes = () => {
    return {
        name: 1,
        userType: 1,
        role: "$role.displayRoleName",
        userEmail: 1,
        status: {$cond: [{$eq: ["$isActive", true]}, "Active", "Inactive"]},
        isLoggedIn: 1,
        lastLoggedIn: {$dateToString: {format: "%d-%m-%Y", date: "$lastLoggedIn"}},
        userIP: 1,
        updatedAt: 1
    };
};
