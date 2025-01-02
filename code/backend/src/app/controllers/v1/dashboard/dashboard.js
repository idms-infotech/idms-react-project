const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../helpers/messages.options");
const {HR} = require("./dash_function/HRDashboard");
const {businessLeads} = require("./dash_function/businessLeadsDashboard");
const {dispatch} = require("./dash_function/dispatchDashboard");
const {employeePortal} = require("./dash_function/esmpDashboard");
const {maintenance} = require("./dash_function/maintenanceDashboard");
const {planning} = require("./dash_function/planningDashboard");
const {production} = require("./dash_function/productionDashboard");
const {purchase} = require("./dash_function/purchaseDashboard");
const {quality} = require("./dash_function/qualityDashboard");
const {sales} = require("./dash_function/salesDashboard");
const {setting} = require("./dash_function/settingsDashboard");
const {stores} = require("./dash_function/storesDashboard");
const {accounts} = require("./dash_function/accountsDashboard");
const memoryCacheHandler = require("../../../utilities/memoryCacheHandler");
const {CONSTANTS} = require("../../../../config/config");
const {createProxyServer} = require("../../../middleware/httpProxyMiddleware");

exports.hrDashboard = asyncHandler(async (req, res) => {
    try {
        let dashboardData = {};
        const cachedData = memoryCacheHandler.get("HR");
        if (cachedData) {
            dashboardData = cachedData;
        } else {
            dashboardData = await HR(req.user.company);
        }
        return res.success(dashboardData);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.purchaseDashboard = asyncHandler(async (req, res) => {
    try {
        let dashboardData = {};
        const cachedData = memoryCacheHandler.get("purchase");
        if (cachedData) {
            dashboardData = cachedData;
        } else {
            dashboardData = await purchase(req.user.company);
        }
        return res.success(dashboardData);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.qualityDashboard = asyncHandler(async (req, res) => {
    try {
        let dashboardData = {};
        const cachedData = memoryCacheHandler.get("quality");
        if (cachedData) {
            dashboardData = cachedData;
        } else {
            dashboardData = await quality(req.user.company);
        }
        return res.success(dashboardData);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.businessLeadsDashboard = asyncHandler(async (req, res) => {
    try {
        let dashboardData = {};
        const cachedData = memoryCacheHandler.get("businessLeads");
        if (cachedData) {
            dashboardData = cachedData;
        } else {
            dashboardData = await businessLeads(req.user.company);
        }
        return res.success(dashboardData);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.storesDashboard = asyncHandler(async (req, res) => {
    try {
        let dashboardData = {};
        const cachedData = memoryCacheHandler.get("stores");
        if (cachedData) {
            dashboardData = cachedData;
        } else {
            dashboardData = await stores(req.user.company);
        }
        return res.success(dashboardData);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.getMastersDashboardDataForEmployeeId = asyncHandler(async (req, res) => {
    try {
        let dashboardData = {};
        // const cachedData = memoryCacheHandler.get("employeePortal");
        // if (cachedData) {
        //     dashboardData = cachedData;
        // } else {
        dashboardData = await employeePortal(req.user.company, req.params.employeeId);
        // }
        return res.success(dashboardData);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.productionDashboard = asyncHandler(async (req, res) => {
    try {
        let dashboardData = {};
        const cachedData = memoryCacheHandler.get("production");
        if (cachedData) {
            dashboardData = cachedData;
        } else {
            dashboardData = await production(req.user.company);
        }
        return res.success(dashboardData);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.dispatchDashboard = asyncHandler(async (req, res) => {
    try {
        let dashboardData = {};
        const cachedData = memoryCacheHandler.get("dispatch");
        if (cachedData) {
            dashboardData = cachedData;
        } else {
            dashboardData = await dispatch(req.user.company);
        }
        return res.success(dashboardData);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.maintenanceDashboard = asyncHandler(async (req, res) => {
    try {
        let dashboardData = {};
        const cachedData = memoryCacheHandler.get("maintenance");
        if (cachedData) {
            dashboardData = cachedData;
        } else {
            dashboardData = await maintenance(req.user.company);
        }
        return res.success(dashboardData);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.settingDashboard = asyncHandler(async (req, res) => {
    try {
        let dashboardData = {};
        const cachedData = memoryCacheHandler.get("setting");
        if (cachedData) {
            dashboardData = cachedData;
        } else {
            dashboardData = await setting(req.user.company, req.user.sub);
        }
        return res.success(dashboardData);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.supportDashboard = asyncHandler(async (req, res) => {
    try {
        let url = `/getSupportDashboard/${CONSTANTS.company_id}`;
        createProxyServer(req, res, url);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.planningDashboard = asyncHandler(async (req, res) => {
    try {
        let dashboardData = {};
        const cachedData = memoryCacheHandler.get("planning");
        if (cachedData) {
            dashboardData = cachedData;
        } else {
            dashboardData = await planning(req.user.company);
        }
        return res.success(dashboardData);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.salesDashboard = asyncHandler(async (req, res) => {
    try {
        let dashboardData = {};
        const cachedData = memoryCacheHandler.get("sales");
        if (cachedData) {
            dashboardData = cachedData;
        } else {
            dashboardData = await sales(req.user.company);
        }
        return res.success(dashboardData);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.accountsDashboard = asyncHandler(async (req, res) => {
    try {
        let dashboardData = {};
        const cachedData = memoryCacheHandler.get("accounts");
        if (cachedData) {
            dashboardData = cachedData;
        } else {
            dashboardData = await accounts(req.user.company);
        }
        return res.success(dashboardData);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
exports.apiStats = asyncHandler(async (req, res) => {
    try {
        const requestCount = memoryCacheHandler.get("requestCount");
        return res.success(requestCount);
    } catch (e) {
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        res.serverError(errors);
        console.error(e);
    }
});
