const app = require("express")();
const {
    getAll,
    getAllMasterData,
    bulkCreate,
    bulkUpdate,
    getSFGListByCategory,
    getChildItemsForReco
} = require("./FGINForSFG");

app.get("/getAll", getAll);
app.post("/bulkCreate", bulkCreate);
app.put("/bulkUpdate", bulkUpdate);
app.get("/getAllMasterData", getAllMasterData);
app.get("/getSFGListByCategory", getSFGListByCategory);
app.get("/getChildItemsForReco", getChildItemsForReco);

module.exports = app;
