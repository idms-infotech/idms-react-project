const {
    getAllShipmentsCounts,
    getAllShipmentsValue,
    getMonthlyShipmentCountTrend,
    getTopFiveShipmentCities,
    getTotalNoOfShipmentPerDay
} = require("../../dispatch/shipmentPlanning/shipmentPlanning");
const {
    getTotalTaxableValue,
    getTotalTaxValue,
    getTopDestination,
    getMonthlyTaxInvoiceCountTrend,
    getTopFiveCustomersByValue,
    getTotalNoOfTaxInvoicedPerDay
} = require("../../dispatch/salesInvoice/salesInvoiceDashboard");
const memoryCacheHandler = require("../../../../utilities/memoryCacheHandler");

exports.dispatch = async company => {
    try {
        const [
            totalShipmentsCounts,
            totalShipmentsValue,
            totalTaxableValue,
            totalTaxValue,
            topDestination,
            monthlyTaxInvoiceCountTrend,
            monthlyShipmentCountTrend,
            topFiveShipmentCities,
            topFiveCustomersByValue,
            totalShipmentApprovedPerDay,
            totalTaxInvoice
        ] = await Promise.all([
            getAllShipmentsCounts(company),
            getAllShipmentsValue(company),
            getTotalTaxableValue(company),
            getTotalTaxValue(company),
            getTopDestination(company),
            getMonthlyTaxInvoiceCountTrend(company),
            getMonthlyShipmentCountTrend(company),
            getTopFiveShipmentCities(company),
            getTopFiveCustomersByValue(company),
            getTotalNoOfShipmentPerDay(company),
            getTotalNoOfTaxInvoicedPerDay(company)
        ]);
        let output = {
            barChartDataShipmentCountTrend: {
                labels: monthlyShipmentCountTrend?.domestic?.months || [],
                datasets: [{data: monthlyShipmentCountTrend?.domestic?.orders || []}]
            },
            barChartDataTaxInvoiceCountTrend: {
                labels: monthlyTaxInvoiceCountTrend?.domestic?.months || [],
                datasets: [{data: monthlyTaxInvoiceCountTrend?.domestic?.orders || []}]
            },
            barChartDataShipmentCities: {
                labels: topFiveShipmentCities?.domestic?.City || [],
                datasets: [{data: topFiveShipmentCities?.domestic?.Count || []}]
            },
            barChartDataCustomersByValue: {
                labels: topFiveCustomersByValue?.domestic?.Customer || [],
                datasets: [{data: topFiveCustomersByValue?.domestic?.Amount || []}]
            },
            totalShipmentsCounts: totalShipmentsCounts?.totalShipments || 0,
            totalPendingShipments: totalShipmentsCounts?.pendingShipments || 0,
            totalShipmentsValue: totalShipmentsValue || 0,
            totalTaxableValue: totalTaxableValue || 0,
            totalTaxValue: totalTaxValue || 0,
            topDestination: topDestination || "-",
            totalShipmentApprovedPerDay: totalShipmentApprovedPerDay || 0,
            invoiceBookedCountPerDay: totalTaxInvoice?.invoiceBookedCountPerDay || 0,
            totalTaxInvoicedValueWithoutTaxPerDay: totalTaxInvoice?.totalTaxInvoicedValueWithoutTax || 0,
            totalTaxInvoicedValueWithTaxPerDay: totalTaxInvoice?.totalTaxInvoicedValueWithTax || 0,
            unit: "Lakh"
        };
        memoryCacheHandler.put("dispatch", {});
        memoryCacheHandler.put("dispatch", output);
        return output;
    } catch (e) {
        console.error(e);
    }
};
