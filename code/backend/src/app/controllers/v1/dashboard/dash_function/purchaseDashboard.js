const {
    getYTDNetPurchase,
    getMTDNetPurchase,
    getPPVData,
    getTopFiveSupplierPurchaseOrderData,
    getTopFiveOrderedItems,
    getMonthlyDomesticPurchaseOrderData,
    getMonthlyImportsPurchaseOrderData,
    getTotalNoOfPurchaseOrderPerDay
} = require("../../purchase/purchaseOrder/purchaseOrderDashboard");
const {getAllSupplierCount} = require("../../purchase/suppliers/suppliers");
const {getAllItemsCount} = require("../../purchase/items/items");
const {getTotalNoOfDebitNotePerDay, getNetDebitNote} = require("../../purchase/debitNote/debitNote");
const {getTotalNoOfServicePurchaseOrderPerDay} = require("../../purchase/servicePurchaseOrder/servicePurchaseOrder");
const {getTotalInventoryValuePerDay} = require("../../stores/Inventory/Inventory");
const {getTotalNoOfOutstandingPOPerDay} = require("../../purchase/purchaseOrder/purchaseOrderReports");
const memoryCacheHandler = require("../../../../utilities/memoryCacheHandler");

exports.purchase = async company => {
    try {
        const [
            ytdNetPurchase,
            mtdNetPurchase,
            suppliersCount,
            itemsCount,
            netDebitNote,
            PPV,
            purchaseOrderPerDay,
            servicePurchaseOrderPerDay,
            debitNotePerDay,
            outstandingPOPerDay,
            inventoryValuePerDay,
            topFiveOrderedItems,
            monthlyDomesticPurchaseOrderData,
            monthlyImportsPurchaseOrderData,
            topFiveSupplierPurchaseOrderData
        ] = await Promise.all([
            getYTDNetPurchase(company),
            getMTDNetPurchase(company),
            getAllSupplierCount(company),
            getAllItemsCount(company),
            getNetDebitNote(company),
            getPPVData(company),
            getTotalNoOfPurchaseOrderPerDay(company),
            getTotalNoOfServicePurchaseOrderPerDay(company),
            getTotalNoOfDebitNotePerDay(company),
            getTotalNoOfOutstandingPOPerDay(company),
            getTotalInventoryValuePerDay(company),
            getTopFiveOrderedItems(company),
            getMonthlyDomesticPurchaseOrderData(company),
            getMonthlyImportsPurchaseOrderData(company),
            getTopFiveSupplierPurchaseOrderData(company)
        ]);
        let output = {
            purchaseYTDImports: +ytdNetPurchase?.YTDNetPurchaseImports || 0,
            purchaseYTDDomestics: +ytdNetPurchase?.YTDNetPurchaseDomestic || 0,
            purchaseMTDImports: +mtdNetPurchase?.MTDNetPurchaseImports || 0,
            purchaseMTDDomestics: +mtdNetPurchase?.MTDNetPurchaseDomestic || 0,
            supplierDomestics: suppliersCount?.domesticSupplierCount || 0,
            supplierImports: suppliersCount?.importSupplierCount || 0,
            itemsCount: itemsCount || 0,
            debitNoteMTD: +netDebitNote?.MTDNetDebitNoteDomestic || 0,
            debitNoteYTD: +netDebitNote?.YTDNetDebitNoteDomestic || 0,
            ppvTotalValue: +PPV?.PPVTotal || 0,
            ppvRatio: PPV?.PPVRatio || 0,
            totalSupplier: +suppliersCount?.domesticSupplierCount + +suppliersCount?.importSupplierCount || 0,
            //mobile start
            purchaseOrderPerDay: purchaseOrderPerDay?.totalPurchaseOrders || 0,
            purchaseOrderValuePerDay: purchaseOrderPerDay?.totalPOValue || 0,

            servicePurchaseOrderPerDay: servicePurchaseOrderPerDay?.totalServicePurchaseOrders || 0,
            servicePurchaseOrderValuePerDay: servicePurchaseOrderPerDay?.totalServicePOValue || 0,

            debitNotePerDay: debitNotePerDay?.totalDebitNote || 0,
            debitNoteValuePerDay: debitNotePerDay?.totalDebitNoteValue || 0,

            outstandingPOPerDay: outstandingPOPerDay?.outstandingPOCount || 0,
            inventoryValuePerDay: inventoryValuePerDay?.totalInventoryValue || 0,
            //mobile end

            unit: "Lakh",
            barChartDataItemsImports: {
                labels: topFiveOrderedItems?.imports?.items || [],
                datasets: [{data: topFiveOrderedItems?.imports?.purchase || []}]
            },
            barChartDataItemsDomestic: {
                labels: topFiveOrderedItems?.domestic?.items || [],
                datasets: [{data: topFiveOrderedItems?.domestic?.purchase || []}]
            },

            barChartDataSupplierImports: {
                labels: topFiveSupplierPurchaseOrderData?.imports?.suppliers || [],
                datasets: [
                    {
                        data: topFiveSupplierPurchaseOrderData?.imports?.purchase || []
                    }
                ]
            },
            barChartDataSupplierDomestic: {
                labels: topFiveSupplierPurchaseOrderData?.domestic?.suppliers || [],
                datasets: [
                    {
                        data: topFiveSupplierPurchaseOrderData?.domestic?.purchase || []
                    }
                ]
            },
            barMonthlyDomesticPurchaseCount: {
                labels: monthlyDomesticPurchaseOrderData?.months || [],
                datasets: [{data: monthlyDomesticPurchaseOrderData?.ordersCount || []}]
            },
            barMonthlyDomesticPurchaseOrderData: {
                labels: monthlyDomesticPurchaseOrderData?.months || [],
                datasets: [{data: monthlyDomesticPurchaseOrderData?.totalOrderSum || []}]
            },
            barMonthlyImportsPurchaseOrderCount: {
                labels: monthlyImportsPurchaseOrderData?.months || [],
                datasets: [{data: monthlyImportsPurchaseOrderData?.ordersCount || []}]
            },
            barMonthlyImportsPurchaseOrderData: {
                labels: monthlyImportsPurchaseOrderData?.months || [],
                datasets: [{data: monthlyImportsPurchaseOrderData?.totalOrderSum || []}]
            }
        };
        memoryCacheHandler.put("purchase", {});
        memoryCacheHandler.put("purchase", output);
        return output;
    } catch (e) {
        console.error(e);
    }
};
