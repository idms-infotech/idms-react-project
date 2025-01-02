require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const {CONSTANTS} = require("./config/config");
const app = express();
if (CONSTANTS.nodeEnv === "development") {
    app.use(morgan("dev"));
}
const PORT = CONSTANTS.port2 || 5004;
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../../employee_mngt/dist")));
app.listen(PORT, console.info(`Server running in ${CONSTANTS.nodeEnv} mode on port ${PORT}`));
