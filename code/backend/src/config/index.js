const {CONSTANTS} = require("./config");

const env = CONSTANTS.nodeEnv || "development";

const config = require(`./environments/${env.toLowerCase()}`); // eslint-disable-line import/no-dynamic-require
// console.log("config", config);
module.exports = config;
