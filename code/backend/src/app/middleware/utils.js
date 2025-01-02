const {permissionForSuperAdmin} = require("../controllers/v1/settings/subModulePermissions/subModulePermissions");
const memoryCacheHandler = require("../utilities/memoryCacheHandler");
const UserRepository = require("../models/settings/repository/userRepository");
const {SUPER_ADMIN_ID} = require("../mocks/constantData");

var utilsObj = {
    rolePermit: (...permittedRoles) => {
        // return a middleware
        return (request, response, next) => {
            const {user} = request;
            if (user && permittedRoles.includes(user.role)) {
                next(); // role is allowed, so continue on the next middleware
            } else {
                return response.unauthorized("Forbidden"); // user is forbidden
            }
        };
    },
    checkSuperAdmin: async userId => {
        let user = await UserRepository.getDocById(userId, {role: 1});
        return user.role.some(x => String(x) == SUPER_ADMIN_ID);
    },
    // inside middleware handler
    // ipMiddleware: function (req, res, next) {
    //   var clientIp = requestIp.getClientIp(req); // on localhost > 127.0.0.1
    // console.log("client ip address", clientIp);
    //   req.userIp = clientIp;
    // console.log("client ip address2",req.userIp);
    //   next();
    // }
    countRequests: (req, res, next) => {
        const path = req.path;
        let requestCount = memoryCacheHandler.get("requestCount") || {};
        requestCount[path] = (requestCount[path] || 0) + 1;
        memoryCacheHandler.put("requestCount", requestCount);
        next();
    },
    mainDataInsertFn: async () => {
        permissionForSuperAdmin();
    }
};

module.exports = utilsObj;

async function clearDatabase() {
    // await UserModel.remove();
    await appParameter.remove();
}
