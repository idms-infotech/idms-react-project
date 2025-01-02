const cryptoHandler = require("../utilities/cryptoHandler");
const decryptMiddleware = (req, res, next) => {
    // Decrypt query params
    for (let key in req.query) {
        if (req.query.hasOwnProperty(key)) {
            try {
                req.query[key] = cryptoHandler.decrypt(req.query[key]);
            } catch (error) {
                return res.serverError("Invalid encrypted query parameter");
            }
        }
    }

    // Decrypt path params if necessary
    if (req.params.id) {
        try {
            req.params.id = cryptoHandler.decrypt(req.params.id);
        } catch (error) {
            return res.serverError("Invalid encrypted path parameter");
        }
    }

    next();
};

module.exports = decryptMiddleware;
