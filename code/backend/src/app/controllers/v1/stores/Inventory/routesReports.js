const app = require("express")();
const {
    getAllReports,
    getReorderLevelReports,
    getStockAgingReports,
    getAllInventoryLocationWiseReports,
    getAllLocationSupplierItemWiseReports,
    getStockPreparationShopReports,
    getAllItemWiseReports,
    getAllInterProdReports
} = require("./InventoryReports");

app.get("/getAllReports", getAllReports);
app.get("/getReorderLevelReports", getReorderLevelReports);
app.get("/getStockAgingReports", getStockAgingReports);
app.get("/getAllInventoryLocationWiseReports", getAllInventoryLocationWiseReports);
app.get("/getAllLocationSupplierItemWiseReports", getAllLocationSupplierItemWiseReports);
app.get("/getStockPreparationShopReports", getStockPreparationShopReports);
app.get("/getAllItemWiseReports", getAllItemWiseReports);
app.get("/getAllInterProdReports", getAllInterProdReports);

module.exports = app;
