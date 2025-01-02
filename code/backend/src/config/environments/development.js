const {CONSTANTS} = require("../config");

module.exports = {
    host: "127.0.0.1",
    port: 27017, // change with development port
    mongoUrl: CONSTANTS.devDataBaseUrl,
    logLevel: CONSTANTS.logLevel, // can be changed to error, warning, info, verbose or silly
    secret: CONSTANTS.sessionSecret,
    JWT_SECRET: "jwtSecret12"
};
