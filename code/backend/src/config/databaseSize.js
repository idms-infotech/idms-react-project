const mongoose = require("mongoose");
const DATABASE_URLS = require("../../src/app/mocks/databaseUrls.json");
let dbStats = [];
async function getDatabaseStats(url) {
    try {
        const connection = await mongoose
            .createConnection(url, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            })
            .asPromise();

        const stats = await connection.db.command({dbStats: 1});
        dbStats.push({
            dbName: stats.db,
            dbSize: bytesToMB(stats.dataSize)
        });

        await connection.close();
    } catch (err) {
        console.error(`Error with database ${url}:`, err);
    }
}
function bytesToMB(bytes) {
    const MB = bytes / (1024 * 1024);
    return +MB.toFixed(0);
}
async function processDatabases() {
    await Promise.all(DATABASE_URLS.map(url => getDatabaseStats(url)));
    dbStats.sort((a, b) => {
        if (a.dbName < b.dbName) {
            return -1;
        }
        if (a.dbName > b.dbName) {
            return 1;
        }
        return 0;
    });

    console.log("All database stats:", dbStats);
}

processDatabases();
