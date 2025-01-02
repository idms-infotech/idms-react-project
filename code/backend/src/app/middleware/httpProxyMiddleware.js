const app = require("express")();
const httpProxy = require("http-proxy");
const {CONSTANTS} = require("../../config/config");
const proxy = httpProxy.createProxyServer();
const baseUrl = `${CONSTANTS.supportUrl}`;
exports.createProxyServer = async (req, res, url) => {
    const targetUrl = `${baseUrl}${url}`;
    const queryParams = new URLSearchParams(req.user);
    const targetWithQuery = `${targetUrl}?${queryParams}`;
    console.log("targetWithQuery", targetWithQuery);
    proxy.web(req, res, {target: targetWithQuery, changeOrigin: true});
};
