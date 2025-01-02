require("dotenv").config();
const config = require("./config");
const express = require("express");
const path = require("path");
const compression = require("compression");
const chalk = require("chalk");
const errorHandler = require("errorhandler");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const lusca = require("lusca");
const fs = require("fs");
const apiRouter = require("./app/routes");
const customResponses = require("./app/helpers/customResponses");
const device = require("express-device");
const app = express();
const {mongooseCon} = require("./config/mongoose");
const {CONSTANTS} = require("./config/config");
const {DIR} = require("./app/mocks/appFileConstants");
const jwtHandler = require("./app/utilities/jwtHandler");
const helmet = require("helmet");
const {mainDataInsertFn} = require("./app/seeders");
const WebCacheMiddleware = require("./app/middleware/webCacheMiddleware");
const RateLimiter = require("./app/utilities/rateLimitHandler");
const CorsHandler = require("./app/utilities/corsHandler");
const cors = require("cors");
const decryptMiddleware = require("./app/middleware/decryptMiddleware");
// const swaggerHandler = require("./app/utilities/swaggerHandler");

// app.use(CorsHandler.getCorsMiddleware());
app.use(cors("*"));
const ENV = CONSTANTS.nodeEnv || config.env;
app.set("env", ENV);
mongooseCon(app);
// swaggerHandler.setup(app);
app.use(device.capture());
app.use(customResponses);
app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));
app.disable("x-powered-by");
app.use(express.json({limit: "50mb"}));
app.use(express.urlencoded({limit: "50mb", extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../../frontend/dist")));
app.use(
    "/assets",
    express.static(path.join(__dirname, "assets"), {
        extensions: ["html"],
        setHeaders(res, _path) {
            if (_path.match(/(\.html|\/sw\.js)$/)) {
                WebCacheMiddleware.setNoCache(res);
                return;
            }

            if (_path.match(/\.(pdf|png|jpg|jpeg|gif|ico|json)$/)) {
                // After final add js|css|
                WebCacheMiddleware.setLongTermCache(res);
            }
        }
    })
);

// GZIP compress resources served
app.use(compression());
app.use(helmet());
app.use(logger("dev"));
logger.token("errorMsg", function (req, res) {
    res.json().then(data => console.info(data));
    return res.error;
});
// app.use(decryptMiddleware);
const rateLimiter = new RateLimiter(5 * 60 * 1000, 250);
rateLimiter.apply(app);
mainDataInsertFn();
// app.use(utils.countRequests);
// JWT token verification Middleware
app.use("/", jwtHandler.getMiddleware());

//Route Prefixes
app.use("/", apiRouter);

//don't show the log when it is production
if (CONSTANTS.nodeEnv !== "production") {
    app.use(logger("dev"));
}

// throw 404 if URL not found
app.all("*", function (req, res) {
    return res.notFound("Page not found");
});

app.use((err, req, res) => {
    if (err.name == "UnauthorizedError") {
        return res.unauthorized(err.message);
    }
});
/**
 * Error Handler.
 */
if (CONSTANTS.nodeEnv === "development") {
    app.use(errorHandler());
}

app.set("port", CONSTANTS.port || 2000);

const server = app.listen(app.get("port"), () => {
    console.info(
        "%s App is running at http://localhost:%d in %s mode",
        chalk.green("✓"),
        app.get("port"),
        app.get("env")
    );
    console.info("Press CTRL-C to stop\n");
});

DIR.forEach(x => {
    if (!fs.existsSync(x)) {
        fs.mkdirSync(x, {recursive: true});
    }
});
module.exports = app;
