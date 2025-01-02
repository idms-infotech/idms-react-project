const config = require("./index");
const mongoose = require("mongoose");

function mongooseCon(app) {
    mongoose
        .connect(config.mongoUrl, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            // auto_reconnect: true,
            // useCreateIndex: true,
            retryWrites: true
        })
        .then(() => {
            console.log("Connected to %s", config.mongoUrl);
            // rename();
            // On successful connection
            mongoose.connection.on("connected", () => {
                console.log("Connected to database");
            });
        })
        .catch(err => {
            mongoose.connection.on("error", error => {
                console.error("Database error: ", error);
            });
            console.error("App starting error:", err.message);
            process.exit(1);
        });
    mongoose.Promise = global.Promise;
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    process.on("SIGHUP", cleanup);
    if (app) {
        app.set("mongoose", mongoose);
    }
}

function cleanup() {
    mongoose.connection.close(function () {
        process.exit(0);
    });
}
const ObjectId = mongoose.Types.ObjectId;
const db = mongoose.connection;
module.exports = {db, mongooseCon, ObjectId};
