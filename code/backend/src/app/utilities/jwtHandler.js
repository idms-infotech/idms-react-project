const jwt = require("jsonwebtoken");
const {CONSTANTS} = require("../../config/config");
const expressJwt = require("express-jwt");
const {PATHS} = require("../mocks/appFileConstants");
class JwtHandler {
    constructor(secretKey) {
        this.secretKey = secretKey;
        this.config = this.configureExpressJwt();
    }
    generateToken(payload, algorithm = "HS256", expiresIn = CONSTANTS.jwtTimeoutDuration) {
        try {
            const token = jwt.sign(payload, this.secretKey, {algorithm, expiresIn});
            return token;
        } catch (error) {
            console.error("Error generating JWT:", error.message);
            throw error;
        }
    }

    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.secretKey);
            return decoded;
        } catch (error) {
            console.error("Error verifying JWT:", error.message);
            throw error;
        }
    }

    configureExpressJwt() {
        return expressJwt({
            credentialsRequired: true,
            secret: this.secretKey,
            algorithms: ["HS256"],
            getToken: function (req) {
                if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
                    return req.headers.authorization.split(" ")[1];
                } else if (req.query && req.query.token) {
                    return req.query.token;
                }
                return null;
            }
        }).unless({
            path: PATHS
        });
    }
    getMiddleware() {
        return this.config;
    }
}

module.exports = new JwtHandler(CONSTANTS.jwtSecret);
