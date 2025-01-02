const {
    getTopFiveOrderedSKUs,
    getTopFiveCustomerSalesOrderData,
    getMonthlySalesTrend,
    getSOBalanceValue,
    getTotalNoOfBookedOrderAndValuePerDay,
    getAllSOValue
} = require("../../sales/salesOrder/salesOrderDashboard");
const {
    getMonthlyTaxInvoiceTrend,
    getAvgMonthlyNetSales,
    getAllNetSalesInvoice
} = require("../../dispatch/salesInvoice/salesInvoiceDashboard");
const {getAllSKUsCount} = require("../../sales/SKU/SKU");
const {getAllCustomersCount} = require("../../sales/customerMaster/customerMaster");
const {getPIConversionRate, getAllPICount} = require("../../sales/proformaInvoice/proformaInvoice");
const {
    getAvgMonthlyNetService,
    getTotalNoOfInvoicesPerDay,
    getAllNetServices
} = require("../../sales/serviceInvoice/serviceInvoice");
const {getMonthDiffFromCurrentFiscalYear} = require("../../../../helpers/dateTime");
const {getTotalNoOfCreditNotePerDay, getAllCreditNote} = require("../../sales/creditNote/creditNote");
const {getTotalDispatchedPerDay} = require("../../sales/dispatchRequestNote/dispatchRequestNote");
const memoryCacheHandler = require("../../../../utilities/memoryCacheHandler");
exports.sales = async company => {
    try {
        const [
            netService,
            netSalesInvoice,
            avgMTDNetTax,
            avgMTDNetService,
            SOValue,
            SOBalValue,
            totalPICount,
            creditNote,
            piConversionRate,
            customersCount,
            SKUsCount,
            monthlySalesTrend,
            monthlyTaxInvoiceTrend,
            topFiveCustomerSOData,
            topFiveSalesOrderSKU,
            totalBookOrderAndValuePerDay,
            totalNoOfInvoicesPerDay,
            totalNoOfCreditNote,
            totalDispatches
        ] = await Promise.all([
            getAllNetServices(company),
            getAllNetSalesInvoice(company),
            getAvgMonthlyNetSales(company),
            getAvgMonthlyNetService(company),
            getAllSOValue(company),
            getSOBalanceValue(company),
            getAllPICount(company),
            getAllCreditNote(company),
            getPIConversionRate(company),
            getAllCustomersCount(company),
            getAllSKUsCount(company),
            getMonthlySalesTrend(company),
            getMonthlyTaxInvoiceTrend(company),
            getTopFiveCustomerSalesOrderData(company),
            getTopFiveOrderedSKUs(company),
            getTotalNoOfBookedOrderAndValuePerDay(company),
            getTotalNoOfInvoicesPerDay(company),
            getTotalNoOfCreditNotePerDay(company),
            getTotalDispatchedPerDay(company)
        ]);
        const ytdNetSales = +netService?.YTDNetService + +netSalesInvoice?.YTDNetSalesInvoice;
        const mtdNetSales = +netService?.MTDNetService + +netSalesInvoice?.MTDNetSalesInvoice;
        const daysDifference = getMonthDiffFromCurrentFiscalYear("days");
        const avgMTDNetSales = (+ytdNetSales / +daysDifference) * 30;
        let output = {
            barChartDataCustomerExports: {
                labels: topFiveCustomerSOData?.exports?.Customers || [],
                datasets: [{data: topFiveCustomerSOData?.exports?.SalesOrders} || []]
            },
            barChartDataCustomerDomestic: {
                labels: topFiveCustomerSOData?.domestic?.Customers || [],
                datasets: [{data: topFiveCustomerSOData?.domestic?.SalesOrders || []}]
            },
            barChartDataSKUsExports: {
                labels: topFiveSalesOrderSKU?.exports?.SKU || [],
                datasets: [{data: topFiveSalesOrderSKU?.exports?.SalesOrders || []}]
            },
            barChartDataSKUsDomestic: {
                labels: topFiveSalesOrderSKU?.domestic?.SKU || [],
                datasets: [{data: topFiveSalesOrderSKU?.domestic?.SalesOrders || []}]
            },
            barMonthlySalesTrendDomestic: {
                labels: monthlySalesTrend?.domestic?.months || [],
                datasets: [{data: monthlySalesTrend?.domestic?.orders || []}]
            },
            barMonthlySalesTrendExports: {
                labels: monthlySalesTrend?.exports?.months,
                datasets: [{data: monthlySalesTrend?.exports?.orders || []}]
            },
            barMonthlyTaxInvoiceTrendDomestic: {
                labels: monthlyTaxInvoiceTrend?.domestic?.months || [],
                datasets: [{data: monthlyTaxInvoiceTrend?.domestic?.orders || []}]
            },
            barMonthlyTaxInvoiceTrendExports: {
                labels: monthlyTaxInvoiceTrend?.exports?.months || [],
                datasets: [{data: monthlyTaxInvoiceTrend?.exports?.orders || []}]
            },
            ytdNetSales: ytdNetSales || 0,
            mtdNetSales: mtdNetSales || 0,
            ytdNetSalesInvoice: netSalesInvoice?.YTDNetSalesInvoice || 0,
            mtdNetSalesInvoice: netSalesInvoice?.MTDNetSalesInvoice || 0,
            ytdNetService: netService?.YTDNetService || 0,
            mtdNetService: netService?.MTDNetService || 0,
            avgMTDNetSales: avgMTDNetSales || 0,
            soBalValue: SOBalValue || 0,
            totalPICount: totalPICount || 0,
            customerCount: customersCount || 0,
            SKUsCount: SKUsCount || 0,
            piConversionRate: piConversionRate || 0,
            ytdSOValue: SOValue?.YTDSOValue || 0,
            mtdSOValue: SOValue?.MTDSOValue || 0,
            ytdCreditNote: creditNote?.YTDCreditNote || 0,
            mtdCreditNote: creditNote?.MTDCreditNote || 0,
            totalNoOfBookedOrderPerDay: totalBookOrderAndValuePerDay?.totalNoOfBookedOrderPerDay || 0,
            totalBookedValuePerDay: totalBookOrderAndValuePerDay?.totalBookedValue || 0,
            totalBookedInvoicesPerDay: totalNoOfInvoicesPerDay?.totalBookedInvoices || 0,
            totalInvoicedValueWithoutTaxPerDay: totalNoOfInvoicesPerDay?.totalInvoicedValueWithoutTax || 0,
            totalInvoicedValueWithTaxPerDay: totalNoOfInvoicesPerDay?.totalInvoicedValueWithTax || 0,
            totalCreditNotePerDay: totalNoOfCreditNote?.totalCreditNote || 0,
            totalCreditNoteValuePerDay: totalNoOfCreditNote?.totalCreditNoteValue || 0,
            totalDispatchesPerDay: totalDispatches || 0,
            unit: "Lakh"
        };
        memoryCacheHandler.put("sales", {});
        memoryCacheHandler.put("sales", output);
        return output;
    } catch (e) {
        console.error(e);
    }
};
