const asyncHandler = require("express-async-handler");
const MESSAGES = require("../../../../helpers/messages.options");
const {createProxyServer} = require("../../../../middleware/httpProxyMiddleware");
const {getAllMasterDataSupport} = require("./Issue");
const {CONSTANTS} = require("../../../../../config/config");
exports.getAll = asyncHandler(async (req, res) => {
    try {
        let url = `/getAllSupport/${CONSTANTS.company_id}`;
        createProxyServer(req, res, url);
    } catch (e) {
        console.error("getAllSupport", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.update = asyncHandler(async (req, res) => {
    try {
        let url = `/updateSupport/${req.params.id}`;
        createProxyServer(req, res, url);
    } catch (e) {
        console.error("update Issue", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getById = asyncHandler(async (req, res) => {
    try {
        let url = `/getByIdSupport/${req.params.id}`;
        createProxyServer(req, res, url);
    } catch (e) {
        console.error("getById Issue", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});
exports.create = asyncHandler(async (req, res) => {
    try {
        let url = `/createSupport/${CONSTANTS.company_id}`;
        createProxyServer(req, res, url);
    } catch (e) {
        console.error("create Issue", e);
        const errors = MESSAGES.apiErrorStrings.SERVER_ERROR;
        return res.serverError(errors);
    }
});

exports.getAllMasterDataSupport = asyncHandler(async (req, res) => {
    try {
        let response = await getAllMasterDataSupport();
        res.success(response);
    } catch (error) {
        console.error("getAllMasterData", error);
        res.status(400);
        throw new Error("Invalid Model data");
    }
});
exports.getAllReportsSupport = asyncHandler(async (req, res) => {
    try {
        let url = `/getAllReportsSupport/${CONSTANTS.company_id}`;
        createProxyServer(req, res, url);
    } catch (error) {
        console.error("getAllMasterData", error);
        res.status(400);
        throw new Error("Invalid Model data");
    }
});
