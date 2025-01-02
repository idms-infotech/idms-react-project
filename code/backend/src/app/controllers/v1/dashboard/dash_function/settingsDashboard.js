const {checkSuperAdmin} = require("../../../../middleware/utils");
const {getAllUserCounts, getAllAdminUserCount} = require("../../settings/user/user");
const {getAllRoleCounts} = require("../../settings/role/role");
const {getAllCompanyLocationCount} = require("../../settings/company/company");
const memoryCacheHandler = require("../../../../utilities/memoryCacheHandler");
exports.setting = async (company, sub) => {
    try {
        let isSuperAdmin = await checkSuperAdmin(sub);
        const [userCounts, roleCounts, adminUserCounts, companyLocationCounts] = await Promise.all([
            getAllUserCounts(company, isSuperAdmin),
            getAllRoleCounts(company, isSuperAdmin),
            getAllAdminUserCount(company),
            getAllCompanyLocationCount()
        ]);
        let output = {
            activeUsers: userCounts?.count || 0,
            loggedInUsers: userCounts?.loggedInCount || 0,
            activeRoles: roleCounts || 0,
            totalAdminUsers: adminUserCounts || 0,
            totalCompanyLocations: companyLocationCounts || 0,
            unit: null
        };
        memoryCacheHandler.put("setting", {});
        memoryCacheHandler.put("setting", output);
        return output;
    } catch (e) {
        console.error(e);
    }
};
