const {CONSTANTS} = require("../config");

module.exports = {
    host: "127.0.0.1",
    port: 27017,
    mongoUrl: CONSTANTS.prodDatabaseUrl,
    logLevel: CONSTANTS.logLevel,
    secret: CONSTANTS.sessionSecret,
    JWT_SECRET: "jwtSecret12"
};
