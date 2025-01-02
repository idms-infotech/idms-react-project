const {CONSTANTS} = require("../../config/config");
module.exports = {
    host: "127.0.0.1",
    port: 27017,
    mongoUrl: CONSTANTS.testDataBaseUrl,
    logLevel: CONSTANTS.logLevel,
    secret: CONSTANTS.sessionSecret,
    JWT_SECRET: "jwtSecret12"
};
