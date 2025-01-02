const {setConversion} = require("../../../../helpers/utility");
const InventoryRepository = require("../../../../models/stores/repository/inventoryCorrectionRepository");

// const migrateInventoryData = async () => {
//     try {
//         let inventoryList = await InventoryRepository.filteredInventoryCorrectionList([
//             {
//                 $project: {_id: 1}
//             }
//         ]);
//         for (const inv of inventoryList) {
//             let ele = await InventoryRepository.getDocById(inv._id);
//             if (ele?.secondaryUnit != "-" && ele?.primaryUnit) {
//                 let UOMConvertData = {
//                     UOM: ele?.secondaryUnit,
//                     quantity: ele?.closedIRQty,
//                     primaryUnit: ele?.primaryUnit,
//                     secondaryUnit: ele?.secondaryUnit,
//                     primaryToSecondaryConversion: ele?.primaryToSecondaryConversion,
//                     secondaryToPrimaryConversion: ele?.secondaryToPrimaryConversion
//                 };
//                 if (ele?.UOM != ele?.secondaryUnit) {
//                     ele.closedIRQty = setConversion(UOMConvertData);
//                     if (ele?.primaryToSecondaryConversion) {
//                         ele.purchaseRate = +(+ele.purchaseRate / +ele.primaryToSecondaryConversion).toFixed(3);
//                         ele.purchaseRatINR = +(+ele.purchaseRatINR / +ele.primaryToSecondaryConversion).toFixed(3);
//                     }
//                     if (ele?.secondaryToPrimaryConversion) {
//                         ele.purchaseRate = +(+ele.purchaseRate * +ele.secondaryToPrimaryConversion).toFixed(3);
//                         ele.purchaseRatINR = +(+ele.purchaseRatINR * +ele.secondaryToPrimaryConversion).toFixed(3);
//                     }
//                     ele.UOM = ele?.secondaryUnit;
//                 }
//             }
//             await ele.save();
//         }
//         console.log("Inventory To Secondary Unit Update SUCCESS");
//     } catch (error) {
//         console.error("error", error);
//     }
// };
