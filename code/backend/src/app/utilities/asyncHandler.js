const asyncHandler = require("express-async-handler");

const asyncHandlerMiddleware = fn => asyncHandler((req, res, next) => Promise.resolve(fn(req, res, next)).catch(next));

module.exports = asyncHandlerMiddleware;
