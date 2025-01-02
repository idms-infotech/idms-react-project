const {
    getAllGINItemCount,
    getTotalInventoryValue,
    getTotalInventoryValuePerDay
} = require("../../stores/Inventory/Inventory");
const {
    getGRNCounts,
    getMonthlyGRNVolume,
    getTotalGRNCreatedPerDay
} = require("../../stores/goodsReceiptNote/goodsReceiptNote");
const {getGINCounts, getTotalGINCreatedPerDay} = require("../../stores/goodsInwardEntry/goodsInwardEntry");
const memoryCacheHandler = require("../../../../utilities/memoryCacheHandler");
const {
    perDayTotalGTResponseAgainstReq,
    getGTResCounts,
    getBarChartGTResStatus
} = require("../../stores/goodsTransferResponse/GTResDashboard");
const {getGTReqCounts} = require("../../planning/goodsTransferRequest/GTReqDashboard");

exports.stores = async company => {
    try {
        const [
            GINItemCount,
            totalInventoryValue,
            GRNCounts,
            GINCounts,
            monthlyGRNVolume,
            totalGRNCreatedPerDay,
            totalGINCreatedPerDay,
            totalInventoryValuePerDay,
            perDayTotGTResAgainstGTReq,
            monthlyGTReqCounts,
            monthlyGTResCounts,
            monthlyBarChartGTRes
        ] = await Promise.all([
            getAllGINItemCount(company),
            getTotalInventoryValue(company),
            getGRNCounts(company),
            getGINCounts(company),
            getMonthlyGRNVolume(company),
            getTotalGRNCreatedPerDay(company),
            getTotalGINCreatedPerDay(company),
            getTotalInventoryValuePerDay(company),
            perDayTotalGTResponseAgainstReq(company),
            getGTReqCounts(company),
            getGTResCounts(company),
            getBarChartGTResStatus(company)
        ]);
        let output = {
            barMonthlyGRNVolume: {
                labels: monthlyGRNVolume?.Months || [],
                datasets: [{data: monthlyGRNVolume?.Orders || []}]
            },
            barMonthlyGIStatus: {
                labels: monthlyBarChartGTRes?.Months || [],
                datasets: [
                    {
                        data: monthlyBarChartGTRes?.GIOpenedData || [],
                        label: "Requested",
                        borderColor: "#009658",
                        backgroundColor: "#009658"
                    },
                    {
                        data: monthlyBarChartGTRes?.GIAcknowledgementData || [],
                        label: "Fulfilled"
                    }
                ]
            },
            GINItemCount: GINItemCount || 0,
            totalInventoryValue: totalInventoryValue || 0,
            GRNCounts: GRNCounts || 0,
            GINCounts: GINCounts || 0,
            GRCounts: monthlyGTReqCounts || 0,
            GICounts: monthlyGTResCounts || 0,
            totalGRNCreatedPerDay: totalGRNCreatedPerDay || 0,
            totalGINCreatedPerDay: totalGINCreatedPerDay || 0,
            totalGoodsIssueAgainstGR: perDayTotGTResAgainstGTReq || 0,
            totalInventoryValuePerDay: totalInventoryValuePerDay || 0
        };
        memoryCacheHandler.put("stores", {});
        memoryCacheHandler.put("stores", output);
        return output;
    } catch (e) {
        console.error(e);
    }
};
