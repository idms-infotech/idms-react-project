const app = require("express")();
const {validate} = require("../../../../middleware/validators");
const upload = require("../../../../middleware/upload");
const RoutesReports = require("./routesReports");
const {
    create,
    getAll,
    getById,
    update,
    deleteById,
    getAllInventoryCorrectionByItems,
    updateSPSInventory,
    getItemsListForReco,
    updateById,
    bulkCreate,
    getProdItemsListForReco,
    getBulkUploadMasterData,
    getItemsBySupplier,
    bulkCreateRawItems
} = require("./Inventory");
const {getAllStockPreparationShop} = require("./InventoryReports");

app.post("/create", create);
app.post("/bulkCreateRawItems", bulkCreateRawItems);
app.post("/bulkCreate", bulkCreate);
app.get("/getAll", getAll);
app.get("/getById/:id", validate("checkParamId"), getById);
app.put("/updateById/:id", validate("checkParamId"), updateById);
app.put("/update", update);
app.put("/updateSPSInventory", updateSPSInventory);
app.delete("/delete/:id", validate("checkParamId"), deleteById);
app.get("/getAllInventoryCorrectionByItems", getAllInventoryCorrectionByItems);
app.get("/getAllStockPreparationShop", getAllStockPreparationShop);
app.get("/getItemsListForReco", getItemsListForReco);
app.get("/getProdItemsListForReco", getProdItemsListForReco);

app.get("/getBulkUploadMasterData", getBulkUploadMasterData);
app.get("/getItemsBySupplier", getItemsBySupplier);
app.use("/", RoutesReports);
module.exports = app;
